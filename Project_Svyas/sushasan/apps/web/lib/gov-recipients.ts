import { promises as fs } from 'node:fs'
import path from 'node:path'

// Who a ward's brief gets delivered to. Email (if set) → automated Resend send;
// phone → WhatsApp delivery. Edit public/data/gov-recipients.json to fill these.

export type Recipient = {
  wardId: string
  name: string | null
  email: string | null
  phone: string | null
  office: string | null
}

// 5-minute TTL, and a failed read is never cached — it used to set
// `_cache = {}` in the catch block, which then served as "no recipients for
// any ward" for the rest of the process's lifetime with no way to recover
// short of a redeploy. A transient read failure should retry next call, not
// silently blank out every ward's dispatch recipient forever.
const CACHE_TTL_MS = 5 * 60 * 1000
let _cache: Record<string, unknown> | null = null
let _cachedAt = 0

async function load(): Promise<Record<string, unknown>> {
  if (_cache && Date.now() - _cachedAt < CACHE_TTL_MS) return _cache
  try {
    const p = path.join(process.cwd(), 'public', 'data', 'gov-recipients.json')
    const loaded = JSON.parse(await fs.readFile(p, 'utf-8')) as Record<string, unknown>
    _cache = loaded
    _cachedAt = Date.now()
    return loaded
  } catch (err) {
    console.error('[gov-recipients] load failed:', err)
    return _cache ?? {} // serve the last good value (if any) rather than blanking out
  }
}

export async function getRecipient(wardId: string): Promise<Recipient> {
  const reg = await load()
  const wards = (reg.wards ?? {}) as Record<string, Record<string, unknown>>
  const w = wards[wardId] ?? {}
  const defaultEmail = (reg.default_office_email as string) ?? null
  return {
    wardId,
    name: (w.name as string) ?? null,
    email: (w.email as string) ?? defaultEmail,
    phone: (w.phone as string) ?? null,
    office: (w.office as string) ?? null,
  }
}
