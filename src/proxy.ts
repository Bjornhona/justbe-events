// src/middleware.ts
import createMiddleware from 'next-intl/middleware'
import {routing} from '@/i18n/routing'

export default createMiddleware(routing)

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
