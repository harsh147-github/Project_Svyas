import { NextRequest, NextResponse } from 'next/server'
import { isGovAuthed } from '@/lib/auth'

/**
 * POST /api/gov/action
 * Loop-closure endpoint — corporator marks a solution actioned or resolved.
 *
 * Body: { solution_id: string, status: 'in_progress' | 'completed', action_desc: string }
 *
 * MVP: stores in-memory (no Supabase). Real pipeline wires to official_actions table.
 */

// In-memory action log for MVP (resets on server restart)
const ACTION_LOG: Array<{
  solution_id: string
  status: string
  action_desc: string
  updated_by: string
  created_at: string
}> = []

export async function POST(req: NextRequest) {
  if (!isGovAuthed(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let body: { solution_id?: string; status?: string; action_desc?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { solution_id, status, action_desc } = body

  if (!solution_id || !status || !action_desc) {
    return NextResponse.json(
      { error: 'Missing required fields: solution_id, status, action_desc' },
      { status: 400 }
    )
  }

  const validStatuses = ['in_progress', 'completed', 'acknowledged']
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${validStatuses.join(', ')}` },
      { status: 400 }
    )
  }

  const action = {
    solution_id,
    status,
    action_desc,
    updated_by: 'gov-user',
    created_at: new Date().toISOString(),
  }

  ACTION_LOG.push(action)

  console.log('[gov/action]', action)

  return NextResponse.json({ ok: true, action }, { status: 200 })
}

export async function GET(req: NextRequest) {
  if (!isGovAuthed(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  return NextResponse.json({ actions: ACTION_LOG })
}
