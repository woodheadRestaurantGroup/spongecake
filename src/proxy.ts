import { NextResponse, type NextRequest } from 'next/server'

/**
 * Passes the request path to server components as a header so the app layout
 * can send an unauthenticated user back to where they were after sign-in.
 */
export default function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next|api|admin|.*\\..*).*)'],
}
