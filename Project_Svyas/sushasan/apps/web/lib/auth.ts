import { NextRequest } from 'next/server'
import { verifyGovBriefToken } from './gov-token'

/**
 * Constant-time string compare for shared secrets. A plain `===` short-circuits
 * on the first differing byte, which leaks a timing signal an attacker can use
 * to guess GOV_ACCESS_TOKEN / ADMIN_TOKEN byte-by-byte — the same class of bug
 * lib/gov-token.ts already guards against for signed mission tokens.
 *
 * This is a hand-rolled XOR loop rather than Node's crypto.timingSafeEqual —
 * this module is imported by middleware.ts, and Next.js middleware always
 * executes in the Edge Runtime (no way to opt into the Node.js runtime there,
 * unlike API routes), which does not support Node's `crypto` module. A plain
 * JS loop works identically in every runtime. Length is compared first (both
 * branches of `&&` still run in the mismatched-length case, so this leaks
 * only whether lengths matched, not which byte differed).
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  const len = Math.max(bufA.length, bufB.length, 1)
  let diff = bufA.length === bufB.length ? 0 : 1
  for (let i = 0; i < len; i++) {
    diff |= (bufA[i] ?? 0) ^ (bufB[i] ?? 0)
  }
  return diff === 0
}

/**
 * Simple env-token government dashboard gate.
 * No full auth system for MVP — just a shared token.
 *
 * Usage: attach as `x-gov-token` header or `?token=` query param.
 */
export function isGovAuthed(req: NextRequest): boolean {
  const govToken = process.env.GOV_ACCESS_TOKEN
  if (!govToken) return false   // token not configured → deny all

  const headerToken = req.headers.get('x-gov-token')
  const queryToken  = req.nextUrl.searchParams.get('token')

  return (!!headerToken && safeEqual(headerToken, govToken)) ||
         (!!queryToken && safeEqual(queryToken, govToken))
}

/**
 * Mission-scoped gov auth for /gov/war-room/[id] links sent in dispatched
 * briefs. Accepts either the master GOV_ACCESS_TOKEN (dashboard users) or a
 * signed per-recipient token minted for this exact missionId (see
 * lib/gov-token.ts) — the latter never unlocks any other mission or the
 * rest of /gov.
 */
export function isGovAuthedForMission(req: NextRequest, missionId: string): boolean {
  if (isGovAuthed(req)) return true

  const candidate = req.headers.get('x-gov-token') ?? req.nextUrl.searchParams.get('token')
  if (!candidate) return false

  const verified = verifyGovBriefToken(candidate)
  return !!verified && verified.missionId === missionId
}

export function isAdminAuthed(req: NextRequest): boolean {
  const adminToken = process.env.ADMIN_TOKEN
  if (!adminToken) return false

  const headerToken = req.headers.get('x-admin-token')
  const queryToken  = req.nextUrl.searchParams.get('token')

  return (!!headerToken && safeEqual(headerToken, adminToken)) ||
         (!!queryToken && safeEqual(queryToken, adminToken))
}
