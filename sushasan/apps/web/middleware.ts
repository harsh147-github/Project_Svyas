import { NextRequest, NextResponse } from 'next/server'
import { isGovAuthed, isAdminAuthed } from '@/lib/auth'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/dashboard/gov') || pathname.startsWith('/gov')) {
    if (!isGovAuthed(req)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  if (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/admin')) {
    if (!isAdminAuthed(req)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/gov/:path*', '/dashboard/admin/:path*', '/gov/:path*', '/admin/:path*'],
}
