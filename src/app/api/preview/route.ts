import { createHash, timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Preview bypass for the site gate — DELETE THIS DIRECTORY ON LAUNCH DAY,
 * together with the coming-soon mode and `src/app/gate/access/`. See the list
 * in `src/app/robots.ts`.
 *
 * `POST /api/preview` with a `password` field — the form on `/gate/access` is
 * the only thing that posts here — drops a cookie that makes `src/proxy.ts`
 * let you past the holding page, then sends you to the home page.
 * `GET /api/preview?key=off` gives the cookie back. That is the whole protocol:
 * no session, no list of users, one shared password.
 *
 * ── THE PASSWORD IS THE SECRET ─────────────────────────────────────────────
 * PREVIEW_KEY is handed to the client out of band, once; anybody who has it is
 * in. That is the right strength for what is behind it — an unfinished
 * marketing site, not customer data.
 *
 * A wrong password redirects back to the form with `?error=1` rather than
 * answering 401/403/404. The login page is linked from the gate, so hiding the
 * route's existence buys nothing, and the one person expected to use it needs
 * to be able to tell "wrong password" from "broken site". An unset PREVIEW_KEY
 * takes the same path: on a deploy where the bypass was never configured,
 * there is no password that works, and nothing to say about why.
 *
 * The comparison is timing-safe. Both sides are hashed first so the buffers are
 * always 32 bytes — `timingSafeEqual` throws on a length mismatch, and a thrown
 * error would leak the password's length through the response.
 * ───────────────────────────────────────────────────────────────────────────
 */

// Reads the request and sets a cookie, so it can never be prerendered.
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

// 303 for both outcomes: the browser has posted the form and should now GET
// wherever it lands, rather than hold on to a redirect it might repeat.
// `no-store` keeps the password's verdict out of any cache in between.
function redirectTo(path: string, request: NextRequest) {
  return NextResponse.redirect(new URL(path, request.url), {
    status: 303,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function POST(request: NextRequest) {
  const password = (await request.formData()).get('password')
  const expected = process.env.PREVIEW_KEY

  if (typeof password !== 'string' || !expected || !matches(password, expected)) {
    return redirectTo('/gate/access?error=1', request)
  }

  const home = redirectTo('/', request)

  home.cookies.set(COOKIE_NAME, '1', {
    // Nothing client-side reads this; it exists for the proxy.
    httpOnly: true,
    // Off in local dev, where there is no https to send it over.
    secure: process.env.NODE_ENV === 'production',
    // `strict` would mean the cookie is withheld on a navigation that arrives
    // from off-site, so the first click after following a link to the login
    // page would land back on the holding page.
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })

  return home
}

// Handing the cookie back needs no password — you can always stop previewing,
// and requiring the secret to undo would mean needing it twice. A GET so it
// stays something you can do from the address bar.
export async function GET(request: NextRequest) {
  // Anything else arriving by GET — a bookmark of the old `?key=` URL, somebody
  // typing the path — is sent to the form, which is now where you get in.
  if (request.nextUrl.searchParams.get('key') !== 'off') {
    return redirectTo('/gate/access', request)
  }

  const home = redirectTo('/', request)
  home.cookies.delete(COOKIE_NAME)

  return home
}
