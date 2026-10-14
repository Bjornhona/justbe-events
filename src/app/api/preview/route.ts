import { createHash, timingSafeEqual } from 'node:crypto'
import { notFound } from 'next/navigation'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Preview bypass for the site gate — DELETE THIS DIRECTORY ON LAUNCH DAY,
 * together with the coming-soon mode. See the list in `src/app/robots.ts`.
 *
 * Visiting `/api/preview?key=<PREVIEW_KEY>` drops a cookie that makes
 * `src/proxy.ts` let you past the holding page, then sends you to the home
 * page. `?key=off` gives the cookie back. That is the whole protocol: there is
 * no login form, no session, no list of users.
 *
 * ── THE URL IS THE SECRET ──────────────────────────────────────────────────
 * Nothing on the site links here, and nothing should. The client gets the URL
 * once, out of band; anybody who has it is in. That is the right strength for
 * what is behind it — an unfinished marketing site, not customer data — and it
 * is the reason for the two rules below.
 *
 * 1. EVERY FAILURE IS A 404, never a 401 or a 403. A 401 says "this route
 *    exists and you guessed wrong", which turns a URL nobody knows about into
 *    a URL worth guessing at. A 404 is indistinguishable from the thousands of
 *    other paths that do not exist, so a scanner learns nothing and moves on.
 *    An unset PREVIEW_KEY is a 404 for the same reason: on a deploy where the
 *    bypass was never configured, the route should not exist at all.
 *
 * 2. The comparison is timing-safe. Both sides are hashed first so the buffers
 *    are always 32 bytes — `timingSafeEqual` throws on a length mismatch, and
 *    a thrown error would leak the key's length through the status code.
 * ───────────────────────────────────────────────────────────────────────────
 */

// Reads a query param and sets a cookie, so it can never be prerendered.
// Node rather than edge because `node:crypto` is what does the comparison.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COOKIE_NAME = 'bv_preview'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function matches(provided: string, expected: string) {
  return timingSafeEqual(
    createHash('sha256').update(provided).digest(),
    createHash('sha256').update(expected).digest(),
  )
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')

  // 303 rather than the default 307: the browser has done the one thing this
  // URL is for, and should now GET the home page rather than hold on to a
  // redirect it might repeat. `no-store` keeps the secret URL out of any
  // cache between here and the visitor.
  const home = NextResponse.redirect(new URL('/', request.url), {
    status: 303,
    headers: { 'Cache-Control': 'no-store' },
  })

  // Handing the cookie back needs no key — you can always stop previewing,
  // and requiring the secret to undo would mean needing it twice.
  if (key === 'off') {
    home.cookies.delete(COOKIE_NAME)
    return home
  }

  const expected = process.env.PREVIEW_KEY

  if (!key || !expected || !matches(key, expected)) {
    notFound()
  }

  home.cookies.set(COOKIE_NAME, '1', {
    // Nothing client-side reads this; it exists for the proxy.
    httpOnly: true,
    // Off in local dev, where there is no https to send it over.
    secure: process.env.NODE_ENV === 'production',
    // The cookie has to survive arriving from whatever the client was sent
    // the URL in — mail, WhatsApp — so `strict` would mean the first click
    // lands back on the holding page.
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })

  return home
}
