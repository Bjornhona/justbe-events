import { z } from 'zod'

/**
 * The contact form's shape, shared by the client component and the route
 * handler. One schema, imported by both, so the browser and the server can
 * never disagree about what counts as a valid enquiry.
 *
 * THE ERROR STRINGS ARE MESSAGE KEYS, NOT PROSE. Every `error:` below is a key
 * under the `ContactForm.errors` namespace in `messages/*.json`. That is what
 * lets one schema serve two masters: the client feeds the key to `useTranslations`
 * and renders Spanish or English, and the route handler can put the same key in
 * its 400 response without having to know the visitor's language or leak an
 * English validation string into a Spanish page.
 *
 * If you add a rule here, add the matching key to BOTH message catalogues.
 */

/**
 * The select's options. Values are stable ASCII slugs and are what gets stored
 * in HubSpot; the visible labels live in the message catalogues, because they
 * have to be translated and these must not be.
 */
export const EVENT_TYPES = [
  'corporate',
  'brand',
  'private',
  'congress',
  'other',
] as const

export type EventType = (typeof EVENT_TYPES)[number]

/**
 * An untouched optional input arrives as `''`, not as `undefined` — the client
 * sends the whole form and empty is a normal answer to an optional question.
 * Left alone that empty string would be handed to `z.coerce.number()`, which
 * turns it into 0 rather than NaN, and "0 attendees" would sail past
 * `.optional()` and land in HubSpot as a real answer. So blanks are folded to
 * `undefined` before any other rule sees them.
 */
const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

/** Today in UTC as `YYYY-MM-DD`, comparable to what `<input type="date">` emits. */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export const contactSchema = z.object({
  firstName: z
    .string({ error: 'firstNameRequired' })
    .trim()
    .min(2, { error: 'firstNameRequired' })
    .max(100, { error: 'tooLong' }),

  lastName: z
    .string({ error: 'lastNameRequired' })
    .trim()
    .min(2, { error: 'lastNameRequired' })
    .max(100, { error: 'tooLong' }),

  // `z.email()` — the v3 spelling `z.string().email()` is deprecated in zod 4.
  // The cap comes first in the message order only by accident of zod; either
  // way an address this long is not a typo we should try to help with.
  email: z
    .string({ error: 'emailRequired' })
    .trim()
    .min(1, { error: 'emailRequired' })
    .max(200, { error: 'tooLong' })
    .pipe(z.email({ error: 'emailInvalid' })),

  // Deliberately loose. Spanish numbers get written `+34 600 00 00 00`,
  // `600000000` and `600 00 00 00` and all three are the same phone; a strict
  // pattern here would reject real people to satisfy a format nobody promised.
  phone: z.preprocess(
    blankToUndefined,
    z
      .string()
      .trim()
      .min(6, { error: 'phoneInvalid' })
      .max(40, { error: 'tooLong' })
      .regex(/^[+0-9()\s.\-]+$/, { error: 'phoneInvalid' })
      .optional(),
  ),

  companyName: z.preprocess(
    blankToUndefined,
    z.string().trim().max(120, { error: 'tooLong' }).optional(),
  ),

  eventType: z.preprocess(
    blankToUndefined,
    z.enum(EVENT_TYPES, { error: 'eventTypeInvalid' }).optional(),
  ),

  // `<input type="date">` always hands over `YYYY-MM-DD`, which is exactly what
  // `z.iso.date()` accepts, so this only ever fails for a hand-typed value or a
  // forged request.
  eventDate: z.preprocess(
    blankToUndefined,
    z
      .iso
      .date({ error: 'eventDateInvalid' })
      .refine((value) => value >= todayUtc(), { error: 'eventDatePast' })
      .optional(),
  ),

  attendees: z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ error: 'attendeesInvalid' })
      .int({ error: 'attendeesInvalid' })
      .min(1, { error: 'attendeesInvalid' })
      .max(100000, { error: 'attendeesInvalid' })
      .optional(),
  ),

  cityOfEvent: z.preprocess(
    blankToUndefined,
    z.string().trim().max(120, { error: 'tooLong' }).optional(),
  ),

  message: z
    .string({ error: 'messageRequired' })
    .trim()
    .min(10, { error: 'messageRequired' })
    .max(3000, { error: 'tooLong' }),

  // The RGPD checkbox. `z.literal(true)` and not `z.boolean()`: the only
  // acceptable value is a ticked box, so an unticked one is a validation
  // failure with a message rather than a quietly-stored `false`. This is the
  // consent recorded under art. 6.1.a in the privacy policy — if this rule ever
  // softens, that policy becomes untrue.
  consent: z.literal(true, { error: 'consentRequired' }),
})

/**
 * The form's state, written out by hand rather than taken from
 * `z.input<typeof contactSchema>`. `z.preprocess` types its own input as
 * `unknown`, so the inferred version would type `empresa`, `fecha`,
 * `asistentes` and the rest as `unknown` and quietly switch off type checking
 * in exactly the component that needs it most.
 *
 * Everything is a string because that is what an `<input>` holds — `asistentes`
 * included. The schema is what turns it into a number.
 */
export type ContactValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string
  eventType: string
  eventDate: string
  attendees: string
  cityOfEvent: string
  message: string
  consent: boolean
}

/** What the schema produces: trimmed, coerced, blanks removed. */
export type ContactParsed = z.output<typeof contactSchema>

/** Field name → the first message key that field failed on. */
export type FieldErrors = Partial<Record<keyof ContactValues, string>>

/**
 * Runs the schema and flattens zod's report down to one key per field, which is
 * all the UI ever shows. Used by the client before it fetches and by the route
 * handler before it calls HubSpot.
 */
export function validateContact(
  input: unknown,
):
  | { success: true; data: ContactParsed }
  | { success: false; errors: FieldErrors } {
  const result = contactSchema.safeParse(input)

  if (result.success) return { success: true, data: result.data }

  const flat = z.flattenError(result.error)
  const errors: FieldErrors = {}

  for (const [field, messages] of Object.entries(flat.fieldErrors)) {
    const first = messages?.[0]
    if (first) errors[field as keyof ContactValues] = first
  }

  return { success: false, errors }
}

/** The blank form. Also the shape the client resets to after a success. */
export const EMPTY_CONTACT: ContactValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  companyName: '',
  eventType: '',
  eventDate: '',
  attendees: '',
  cityOfEvent: '',
  message: '',
  // Never `true`. Pre-ticking a consent box is not consent under the RGPD
  // (art. 4.11 requires an unambiguous affirmative action), so this default is
  // load-bearing rather than cosmetic.
  consent: false,
}
