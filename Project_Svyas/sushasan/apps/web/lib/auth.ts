import { NextRequest } from 'next/server'
import { verifyGovBriefToken } from './gov-token'

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

  return headerToken === govToken || queryToken === govToken
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

  return headerToken === adminToken || queryToken === adminToken
}
