import { hmac } from '@noble/hashes/hmac.js'
import { sha256 } from '@noble/hashes/sha2.js'

// @noble/hashes is a zero-dependency, pure-JS, synchronous implementation —
// used instead of Node's `crypto` module because this file is imported by
// middleware.ts, and Next.js middleware always runs in the Edge Runtime
// (no way to opt into the Node.js runtime there), which does not support
// Node's `crypto`. Web Crypto's SubtleCrypto would work in both runtimes but
// is Promise-based, which would force every caller of signGovBriefToken /
// verifyGovBriefToken (and isGovAuthedForMission, and middleware.ts itself)
// to become async — a much larger, riskier change for the same result.

function hmacSha256(secret: string, payload: string): Uint8Array {
  return hmac(sha256, new TextEncoder().encode(secret), new TextEncoder().encode(payload))
}

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url')
}

// Constant-time compare — see lib/auth.ts's safeEqual for why this is a
// hand-rolled loop instead of Node's crypto.timingSafeEqual.
function safeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  const len = Math.max(a.length, b.length, 1)
  let diff = a.length === b.length ? 0 : 1
  for (let i = 0; i < len; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  }
  return diff === 0
}

// Per-recipient, per-mission signed links for gov briefs.
//
// Previously every brief email/WhatsApp message embedded GOV_ACCESS_TOKEN —
// the single master credential that unlocks the entire /gov dashboard for
// every ward — directly in the link (lib/gov-brief.ts, gov-dispatch). One
// forwarded email meant permanent full gov access for anyone who opened it.
//
// Instead, dispatch signs a token scoped to (missionId, recipient) with an
// expiry: HMAC_SHA256(missionId|recipient|expiry, GOV_TOKEN_SIGNING_SECRET).
// It only unlocks that one mission's War Room page, not the rest of /gov,
// and it stops working after DEFAULT_EXPIRY_DAYS. The master GOV_ACCESS_TOKEN
// still exists for direct dashboard use by the founder/admins — it is simply
// never mailed out anymore.

const SEP = '.'
const DEFAULT_EXPIRY_DAYS = 7

export function isGovTokenSigningConfigured(): boolean {
  return !!process.env.GOV_TOKEN_SIGNING_SECRET
}

export function signGovBriefToken(
  missionId: string,
  recipient: string,
  expiresInDays = DEFAULT_EXPIRY_DAYS,
): string | null {
  const secret = process.env.GOV_TOKEN_SIGNING_SECRET
  if (!secret) return null
  const exp = Date.now() + expiresInDays * 24 * 60 * 60 * 1000
  const payload = `${missionId}|${recipient}|${exp}`
  const sig = toBase64Url(hmacSha256(secret, payload))
  return `${Buffer.from(payload, 'utf8').toString('base64url')}${SEP}${sig}`
}

export function verifyGovBriefToken(token: string): { missionId: string; recipient: string } | null {
  const secret = process.env.GOV_TOKEN_SIGNING_SECRET
  if (!secret || !token || !token.includes(SEP)) return null

  const [payloadB64, sig] = token.split(SEP)
  if (!payloadB64 || !sig) return null

  let payload: string
  try {
    payload = Buffer.from(payloadB64, 'base64url').toString('utf8')
  } catch {
    return null
  }

  const expectedSig = toBase64Url(hmacSha256(secret, payload))
  if (!safeEqualBytes(Buffer.from(sig), Buffer.from(expectedSig))) return null

  const [missionId, recipient, expStr] = payload.split('|')
  const exp = Number(expStr)
  if (!missionId || !recipient || !Number.isFinite(exp) || Date.now() > exp) return null

  return { missionId, recipient }
}
