import { NextRequest, NextResponse } from 'next/server'
import { isGovAuthed, isAdminAuthed } from '@/lib/auth'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Gov dashboard protection
  if (pathname.startsWith('/gov')) {
    if (!isGovAuthed(req)) {
      return new NextResponse('Unauthorized', { status: 401 })
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
