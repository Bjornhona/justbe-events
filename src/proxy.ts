// src/proxy.ts
import createMiddleware from 'next-intl/middleware'
import {NextResponse, type NextRequest} from 'next/server'
import {routing} from '@/i18n/routing'

const intlProxy = createMiddleware(routing)

// ---------------------------------------------------------------------------
// COMING SOON — DELETE THIS WHOLE BLOCK ON LAUNCH DAY, and remove the
// COMING_SOON environment variable from Vercel at the same time.
// While COMING_SOON === '1' every public request is rewritten to the holding
// page. Rewrite, not redirect, so the URL in the address bar stays clean.
// ---------------------------------------------------------------------------
function isExemptFromComingSoon(pathname: string) {
  return (
    pathname === '/studio' ||
    pathname.startsWith('/studio/') || // embedded Sanity Studio
    pathname === '/api' ||
    pathname.startsWith('/api/') || // route handlers
    pathname === '/coming-soon' || // the holding page itself
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_vercel/') ||
    pathname.includes('.') // static assets: favicon, og images, robots.txt
  )
}

export default function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl

  if (process.env.COMING_SOON === '1' && !isExemptFromComingSoon(pathname)) {
    return NextResponse.rewrite(new URL('/coming-soon', request.url))
  }

  // Normal behaviour: hand off to next-intl untouched.
  return intlProxy(request)
}

export const config = {
  // The negative lookahead is what keeps the Studio working.
  // Without `studio` in this list, /studio gets rewritten to /es/studio
  // and you get a 404 that looks like a Sanity problem but isn't.
  //
  //   api         — route handlers (contact form → HubSpot, later)
  //   studio      — embedded Sanity Studio
  //   coming-soon — holding page, outside [locale]; DELETE THIS WITH THE PAGE
  //   _next       — Next.js internals
  //   _vercel     — Vercel internals
  //   .*\..*      — anything with an extension (favicon, og images, robots.txt)
  matcher: ['/((?!api|studio|coming-soon|_next|_vercel|.*\\..*).*)'],
}
