// src/proxy.ts
import createMiddleware from 'next-intl/middleware'
import {NextResponse, type NextRequest} from 'next/server'
import {routing} from '@/i18n/routing'

const intlProxy = createMiddleware(routing)

// ---------------------------------------------------------------------------
// SITE GATE
//
// While SITE_GATE is set, every public request is rewritten to `/gate`.
// Rewrite, not redirect, so the URL in the address bar stays clean and a
// visitor who was sent a deep link still has it when the gate comes down.
//
//   "coming-soon"   holding page, 200. Goes on launch day, along with this
//                   branch, the PREVIEW_KEY bypass and `src/app/api/preview/`.
//   "maintenance"   same page, different sentence, 503 + Retry-After. This one
//                   is meant to outlive launch: it is how the site gets taken
//                   down for ten minutes without anybody deploying a branch.
//   unset / "off"   normal site.
//
// Set in Vercel (Production), not in the repo — flipping the switch should be
// a dashboard change and a redeploy, not a commit.
// ---------------------------------------------------------------------------
const PREVIEW_COOKIE = 'bv_preview'

function isExemptFromGate(request: NextRequest) {
  const {pathname} = request.nextUrl

  return (
    pathname === '/studio' ||
    pathname.startsWith('/studio/') || // embedded Sanity Studio
    pathname === '/api' ||
    pathname.startsWith('/api/') || // route handlers, incl. the preview bypass
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_vercel/') ||
    pathname.includes('.') || // static assets: favicon, og images, robots.txt
    // Whoever has been given the preview URL. The cookie is set by
    // `/api/preview?key=…` and is the only thing that opens the gate from
    // outside; see that route for why there is nothing stronger here.
    request.cookies.get(PREVIEW_COOKIE)?.value === '1'
  )
}

export default function proxy(request: NextRequest) {
  // Deliberately an early return with its own `switch`, kept separate from the
  // next-intl hand-off below: the gate is temporary scaffolding around the
  // real routing, and should read — and delete — as one block.
  if (!isExemptFromGate(request)) {
    const gate = (mode: string) => new URL(`/gate?mode=${mode}`, request.url)

    switch (process.env.SITE_GATE) {
      case 'coming-soon':
        return NextResponse.rewrite(gate('coming-soon'))

      case 'maintenance':
        // 503 is the honest code for "the site is up but deliberately closed",
        // and the one that stops crawlers treating a ten-minute outage as the
        // page being gone. Retry-After is in seconds: come back in an hour.
        return NextResponse.rewrite(gate('maintenance'), {
          status: 503,
          headers: {'Retry-After': '3600'},
        })
    }
  }

  // Normal behaviour: hand off to next-intl untouched.
  return intlProxy(request)
}

export const config = {
  // The negative lookahead is what keeps the Studio working.
  // Without `studio` in this list, /studio gets rewritten to /es/studio
  // and you get a 404 that looks like a Sanity problem but isn't.
  //
  //   api    — route handlers (contact form → HubSpot, preview bypass)
  //   studio — embedded Sanity Studio
  //   gate   — the gate page itself, outside [locale]
  //   _next  — Next.js internals
  //   _vercel — Vercel internals
  //   .*\..* — anything with an extension (favicon, og images, robots.txt)
  matcher: ['/((?!api|studio|gate|_next|_vercel|.*\\..*).*)'],
}
