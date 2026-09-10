import type { NextRequest } from 'next/server'

import {
  validateContact,
  type ContactParsed,
  type FieldErrors,
} from '@/lib/contact'

/**
 * Contact form → HubSpot, server side only.
 *
 * ── WHY THIS IS A ROUTE HANDLER AND NOT A HUBSPOT EMBED ────────────────────
 * HubSpot's embedded form and its tracking script (`js.hs-scripts.com`) set
 * first-party analytics cookies — `hubspotutk` above all — the moment they
 * load. Those are not "strictly necessary" cookies, so under art. 22.2 LSSI-CE
 * they need prior consent, which means a consent banner, and they would make
 * the published cookie policy ("no utiliza cookies de análisis, publicidad ni
 * seguimiento de terceros") false on the day they ship.
 *
 * So the browser never talks to HubSpot at all. It posts JSON to this handler,
 * and this handler talks to HubSpot from the server. No third-party script, no
 * third-party cookie, no banner, and the cookie policy stays true.
 *
 * If you are ever asked to "just add the HubSpot tracking code so we get
 * analytics", the answer is that it also needs a consent banner and a rewrite
 * of the cookie policy. It is not a one-line change.
 *
 * Nothing below sets a cookie, and the responses carry no `Set-Cookie`.
 * ───────────────────────────────────────────────────────────────────────────
 */

// Reads the request body and the client IP, so it can never be prerendered.
// Node rather than edge because the rate-limit Map below wants the longer-lived
// instances, and there is nothing here that benefits from edge latency.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// HubSpot's no-auth Forms submission endpoint. Public by design — it takes the
// portal id and form guid in the path and needs no token, which is why there is
// no HUBSPOT_PRIVATE_APP_TOKEN in the environment.
const HUBSPOT_ENDPOINT = 'https://api.hsforms.com'

/**
 * Our field names → the form's internal HubSpot names.
 *
 * These must match the internal names of the properties on the HubSpot form
 * identified by HUBSPOT_FORM_GUID.
 *
 * ⚠ A WRONG NAME HERE FAILS SILENTLY. Verified against the live form: posting a
 * field the form does not define returns `200 {"inlineMessage":""}` exactly like
 * a good submission — HubSpot discards the unknown field and says nothing. So a
 * typo on the right-hand side does not raise an error anywhere; the enquiry
 * arrives with that answer simply missing, and the only way to notice is that a
 * column is always blank in HubSpot.
 *
 * `firstname`, `lastname`, `email`, `phone`, `company` and `message` are HubSpot
 * defaults. The four `event_*` / `city_of_event` / `number_of_attendees` entries
 * are custom properties that must exist on the form — confirm their internal
 * names in HubSpot (Forms → edit → the property's internal name, not its label)
 * before trusting the data.
 *
 * THERE IS DELIBERATELY NO `consent` ENTRY HERE. The consent box on the HubSpot
 * form is the built-in GDPR consent block, which has no backing contact
 * property, so a `{name: 'consent'}` field was silently discarded on every
 * submission — the silent-failure mode described above, in the wild. Consent is
 * recorded through `legalConsentOptions` further down, which is the supported
 * mechanism and the one the privacy policy's art. 6.1.a claim rests on. Do not
 * "restore" a consent field here; it would look like it was working and would
 * record nothing.
 */
const HUBSPOT_FIELDS = {
  firstName: 'firstname',
  lastName: 'lastname',
  email: 'email',
  phone: 'phone',
  companyName: 'company',
  eventType: 'event_type',
  eventDate: 'event_date',
  attendees: 'number_of_attendees',
  cityOfEvent: 'city_of_event',
  message: 'message',
} as const satisfies Record<string, string>

// ---------------------------------------------------------------------------
// Rate limit
// ---------------------------------------------------------------------------

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

/**
 * Per-IP submission counts, in memory.
 *
 * BE HONEST ABOUT WHAT THIS IS. On Vercel each serverless instance has its own
 * copy of this Map, and instances come and go, so the real ceiling is "5 per
 * window per warm instance" and a cold start resets it. It stops a stuck submit
 * button and casual form spam. It is NOT a security boundary and will not stop
 * a distributed or determined attacker — if that day comes, this needs to move
 * to something shared (Upstash, Vercel KV) rather than being tuned here.
 */
const hits = new Map<string, { count: number; resetAt: number }>()

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })

    // The Map is the only thing in this module that grows without bound, and a
    // long-lived instance would otherwise hold every IP that ever posted. Since
    // we are already walking a write, drop everything expired. Cheap because
    // the map stays small by construction.
    if (hits.size > 500) {
      for (const [key, value] of hits) {
        if (now > value.resetAt) hits.delete(key)
      }
    }

    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) return false

  entry.count += 1
  return true
}

/**
 * `x-forwarded-for` is a comma-separated chain and the client is the first
 * entry. It is trivially spoofable in general, but on Vercel the proxy rewrites
 * it, so it is trustworthy in production and merely useless locally — which is
 * the right trade for a best-effort limiter.
 */
function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/** The only shapes this route ever returns. `error` is a key, never prose. */
type ContactResponse =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: FieldErrors }

function json(body: ContactResponse, status: number) {
  return Response.json(body, {
    status,
    // A contact endpoint has nothing cacheable and nothing a crawler should
    // hold on to.
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function POST(request: NextRequest) {
  // --- 1. body -------------------------------------------------------------
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return json({ ok: false, error: 'badRequest' }, 400)
  }

  if (typeof payload !== 'object' || payload === null) {
    return json({ ok: false, error: 'badRequest' }, 400)
  }

  const body = payload as Record<string, unknown>

  // --- 2. honeypot ---------------------------------------------------------
  // A field that is hidden from people and irresistible to bots that fill in
  // every input they find. Anything in it means "not a human".
  //
  // Returns 200, not 403, and stops here without touching HubSpot. Telling a
  // bot that it failed is free tuning information; letting it believe it
  // succeeded costs us nothing and teaches it nothing.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    // Everything worth knowing goes in the message string rather than a second
    // argument: Next's dev logger renders an object argument as `{}`, and the
    // IP is the only part of these lines anybody ever reads.
    console.warn(`[contact] honeypot triggered — ip=${clientIp(request)}`)
    return json({ ok: true }, 200)
  }

  // --- 3. rate limit -------------------------------------------------------
  const ip = clientIp(request)
  if (!rateLimit(ip)) {
    console.warn(`[contact] rate limited — ip=${ip}`)
    return json({ ok: false, error: 'rateLimited' }, 429)
  }

  // --- 4. validate ---------------------------------------------------------
  // The client already ran this exact schema, so reaching here with errors
  // means either a forged request or a genuine bug — never a normal visitor.
  const result = validateContact(body)

  if (!result.success) {
    return json(
      { ok: false, error: 'validation', fieldErrors: result.errors },
      400,
    )
  }

  // --- 5. configuration ----------------------------------------------------
  // Checked at request time rather than at module load: a missing variable
  // should break the contact form, not the whole deployment.
  const portalId = process.env.HUBSPOT_PORTAL_ID
  const formGuid = process.env.HUBSPOT_FORM_GUID

  if (!portalId || !formGuid) {
    console.error(
      '[contact] enquiry NOT delivered — missing env: ' +
        [!portalId && 'HUBSPOT_PORTAL_ID', !formGuid && 'HUBSPOT_FORM_GUID']
          .filter(Boolean)
          .join(', '),
    )
    return json({ ok: false, error: 'server' }, 500)
  }

  // --- 6. hand off to HubSpot ---------------------------------------------
  try {
    await submitToHubSpot(result.data, portalId, formGuid, request)
  } catch (error) {
    // Everything HubSpot said stays here, in the server log. The client gets a
    // bare `server` key: HubSpot's errors quote the payload back, which would
    // put the visitor's own details — and our portal id and property names —
    // into a response that anyone can read.
    console.error(
      `[contact] HubSpot submission failed — ip=${ip} — ` +
        (error instanceof Error ? error.message : String(error)),
    )
    return json({ ok: false, error: 'server' }, 502)
  }

  return json({ ok: true }, 200)
}

/**
 * Posts one enquiry to the HubSpot Forms API. Throws on any non-2xx so the
 * caller does the logging in one place.
 */
async function submitToHubSpot(
  data: ContactParsed,
  portalId: string,
  formGuid: string,
  request: NextRequest,
) {
  // Only the fields that were actually filled in. HubSpot treats an empty
  // string as a real value and will happily blank out a property on an existing
  // contact record with it, so an unanswered optional question must be absent
  // rather than empty.
  const fields = [
    { name: HUBSPOT_FIELDS.firstName, value: data.firstName },
    { name: HUBSPOT_FIELDS.lastName, value: data.lastName },
    { name: HUBSPOT_FIELDS.email, value: data.email },
    ...(data.phone
      ? [{ name: HUBSPOT_FIELDS.phone, value: data.phone }]
      : []),
    ...(data.companyName
      ? [{ name: HUBSPOT_FIELDS.companyName, value: data.companyName }]
      : []),
    ...(data.eventType
      ? [{ name: HUBSPOT_FIELDS.eventType, value: data.eventType }]
      : []),
    ...(data.eventDate ? [{ name: HUBSPOT_FIELDS.eventDate, value: data.eventDate }] : []),
    ...(data.attendees !== undefined
      ? [{ name: HUBSPOT_FIELDS.attendees, value: String(data.attendees) }]
      : []),
    ...(data.cityOfEvent
      ? [{ name: HUBSPOT_FIELDS.cityOfEvent, value: data.cityOfEvent }]
      : []),
    { name: HUBSPOT_FIELDS.message, value: data.message }
  ]

  const response = await fetch(
    `${HUBSPOT_ENDPOINT}/submissions/v3/integration/submit/${portalId}/${formGuid}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields,

        // Records the RGPD tick against the contact in HubSpot, so the legal
        // basis claimed in the privacy policy (art. 6.1.a, consent given by
        // ticking the box) is evidenced where the data actually lives and not
        // only in our server logs.
        legalConsentOptions: {
          consent: {
            consentToProcess: true,
            text: CONSENT_RECORD_TEXT,
          },
        },

        context: {
          // NOTE THE ABSENCE OF `hutk`. HubSpot's context accepts a `hutk`
          // field — the value of the `hubspotutk` tracking cookie — which is
          // what stitches a submission to a visitor's browsing history. We have
          // no such cookie because we load no HubSpot script, and this is the
          // line that would reintroduce cross-site tracking if someone added
          // one later. Leave it out.
          pageUri: request.headers.get('referer') ?? undefined,
          pageName: 'B Events — contact',
        },
      }),

      // Without this a hung HubSpot would hold the request open until the
      // platform's own timeout, and the visitor would watch a disabled button
      // for the better part of a minute.
      signal: AbortSignal.timeout(10_000),
    },
  )

  if (!response.ok) {
    // Read the body only to put it in our log — it never reaches the client.
    const detail = await response.text().catch(() => '<unreadable>')
    throw new Error(`HubSpot responded ${response.status}: ${detail}`)
  }
}

/**
 * Stored with the submission as the exact wording the visitor agreed to.
 * Should track the checkbox label in `messages/*.json`; if that label is
 * reworded, reword this too, because this is the copy that would be produced as
 * evidence of consent.
 */
const CONSENT_RECORD_TEXT =
  'He leído y acepto la Política de Privacidad de Barbara Juan Portoles Events, S.L. / ' +
  'I have read and accept the Privacy Policy of Barbara Juan Portoles Events, S.L.'
