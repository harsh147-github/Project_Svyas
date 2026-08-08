import { createHmac, timingSafeEqual } from 'crypto'

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
  const sig = createHmac('sha256', secret).update(payload).digest('base64url')
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

  const expectedSig = createHmac('sha256', secret).update(payload).digest('base64url')
  const sigBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expectedSig)
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null

  const [missionId, recipient, expStr] = payload.split('|')
  const exp = Number(expStr)
  if (!missionId || !recipient || !Number.isFinite(exp) || Date.now() > exp) return null

  return { missionId, recipient }
}
