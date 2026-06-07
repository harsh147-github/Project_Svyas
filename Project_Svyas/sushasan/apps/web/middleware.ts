import { NextRequest, NextResponse } from 'next/server'
import { isGovAuthed, isAdminAuthed } from '@/lib/auth'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow OG image generation routes through — they're meta assets
  if (pathname.endsWith('/opengraph-image') || pathname.endsWith('/twitter-image')) {
    return NextResponse.next()
  }

  // Gov dashboard protection (exclude /gov-access itself to avoid redirect loop)
  if (pathname.startsWith('/gov') && !pathname.startsWith('/gov-access')) {
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
