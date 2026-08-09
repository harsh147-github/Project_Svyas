// Durable, multi-instance rate limiting via Upstash Redis, with an
// in-memory sliding-window fallback for local dev / when Upstash isn't
// configured. The routes that previously rolled their own per-instance
// `Map` (add-report, gov/assist, gov/command-agent) reset on every cold
// start and don't share state across concurrent serverless instances —
// on Vercel that means the "limit" is really "limit × however many
// instances happen to be warm", which is not a limit at all under a
// real flood. transcribe and plus-one had no rate limiting whatsoever.
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'

let redisLimiters: Map<string, Ratelimit> | null = null

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

function limiterFor(route: string, limit: number, windowSec: number): Ratelimit | null {
  const redis = getRedis()
  if (!redis) return null
  if (!redisLimiters) redisLimiters = new Map()
  const key = `${route}:${limit}:${windowSec}`
  let rl = redisLimiters.get(key)
  if (!rl) {
    rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: `sushasan:ratelimit:${route}`,
      analytics: false,
    })
    redisLimiters.set(key, rl)
  }
  return rl
}

// ── In-memory fallback (per-instance, used only when Upstash is unset) ─────
const _memory = new Map<string, { count: number; resetAt: number }>()
const MEMORY_PRUNE_THRESHOLD = 5000

// Silent degradation here means an operator believes public write endpoints
// are durably rate-limited when they're actually only protected per-instance
// (resets on every cold start, and each concurrent instance gets its own
// budget). Warn once per cold start rather than staying quiet.
let _warnedInMemory = false
function warnInMemoryOnce(): void {
  if (_warnedInMemory) return
  _warnedInMemory = true
  console.warn('[rate-limit] Upstash env missing — using per-instance in-memory limiter (NOT durable)')
}

function memoryLimit(key: string, limit: number, windowSec: number): boolean {
  const now = Date.now()
  if (_memory.size >= MEMORY_PRUNE_THRESHOLD) {
    for (const [k, v] of _memory) if (now >= v.resetAt) _memory.delete(k)
  }
  const entry = _memory.get(key)
  if (!entry || now >= entry.resetAt) {
    _memory.set(key, { count: 1, resetAt: now + windowSec * 1000 })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

/**
 * Returns true if the request is within limit, false if it should be
 * rejected with 429. `route` scopes the limiter key so different endpoints
 * don't share a budget; `identifier` is typically an IP or IP+resource key.
 */
export async function checkRateLimit(
  route: string,
  identifier: string,
  opts: { limit: number; windowSec: number },
): Promise<boolean> {
  const rl = limiterFor(route, opts.limit, opts.windowSec)
  if (rl) {
    const { success } = await rl.limit(identifier)
    return success
  }
  warnInMemoryOnce()
  return memoryLimit(`${route}:${identifier}`, opts.limit, opts.windowSec)
}

/** Best-effort client IP from Vercel's edge-set forwarding header. */
export function clientIp(req: NextRequest | Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
