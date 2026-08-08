import { NextRequest, NextResponse } from 'next/server'
import { isGovAuthed, isGovAuthedForMission, isAdminAuthed } from '@/lib/auth'

const WAR_ROOM_PREFIX = '/gov/war-room/'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow OG image generation routes through — they're meta assets
  if (pathname.endsWith('/opengraph-image') || pathname.endsWith('/twitter-image')) {
    return NextResponse.next()
  }

  // Gov dashboard protection (exclude /gov-access itself to avoid redirect loop)
  if (pathname.startsWith('/gov') && !pathname.startsWith('/gov-access')) {
    // War Room links carry a mission-scoped signed token (see lib/gov-token.ts)
    // instead of the master GOV_ACCESS_TOKEN, so a forwarded brief link only
    // ever unlocks the one mission it was minted for.
    if (pathname.startsWith(WAR_ROOM_PREFIX)) {
      const missionId = pathname.slice(WAR_ROOM_PREFIX.length).split('/')[0]
      if (missionId && isGovAuthedForMission(req, missionId)) {
        return NextResponse.next()
      }
    }
    if (!isGovAuthed(req)) {
      const url = req.nextUrl.clone()
      url.pathname = '/gov-access'
      return NextResponse.redirect(url, 307)
    }
  }

  // Admin pages protection
  if (pathname.startsWith('/admin')) {
    if (!isAdminAuthed(req)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/gov/:path*', '/admin/:path*'],
}
