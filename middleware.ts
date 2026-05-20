import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Pass request through without middleware processing
  // Authentication is handled client-side in pages
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
