import { NextRequest } from 'next/server'

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

export function isAdminAuthed(req: NextRequest): boolean {
  const adminToken = process.env.ADMIN_TOKEN
  if (!adminToken) return false

  const headerToken = req.headers.get('x-admin-token')
  const queryToken  = req.nextUrl.searchParams.get('token')

  return headerToken === adminToken || queryToken === adminToken
}
