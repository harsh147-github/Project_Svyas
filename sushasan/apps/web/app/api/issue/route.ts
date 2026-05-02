import { NextRequest, NextResponse } from 'next/server'
import { addUserIssue, getUserIssues } from '@/lib/issues-store'

const VALID_TAGS = new Set(['traffic', 'water', 'electricity', 'garbage', 'other'])
const VALID_WARDS = new Set(['43', '46', '47'])

export async function GET() {
  return NextResponse.json({ issues: getUserIssues() })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const issue_tag = String(body.issue_tag ?? '')
  const ward_id = String(body.ward_id ?? '')
  const description = String(body.description ?? '').trim()
  const location_hint = body.location_hint ? String(body.location_hint) : null
  const lat = typeof body.lat === 'number' ? body.lat : null
  const lng = typeof body.lng === 'number' ? body.lng : null

  if (!VALID_TAGS.has(issue_tag)) {
    return NextResponse.json({ error: 'Invalid issue_tag' }, { status: 400 })
  }
  if (!VALID_WARDS.has(ward_id)) {
    return NextResponse.json({ error: 'Invalid ward_id' }, { status: 400 })
  }
  if (description.length < 12) {
    return NextResponse.json({ error: 'Description must be at least 12 characters' }, { status: 400 })
  }

  const issue = addUserIssue({
    issue_tag: issue_tag as 'traffic' | 'water' | 'electricity' | 'garbage' | 'other',
    ward_id,
    description,
    location_hint,
    lat,
    lng,
  })

  return NextResponse.json({ ok: true, issue }, { status: 201 })
}
