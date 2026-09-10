'use client'

import { useId, useRef, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/routing'
import {
  EMPTY_CONTACT,
  EVENT_TYPES,
  validateContact,
  type ContactValues,
  type FieldErrors,
} from '@/lib/contact'

/**
 * The contact form. Client Component, because it owns the field state, the
 * inline validation and the pending/success/error cycle.
 *
 * ── HOW IT SUBMITS ─────────────────────────────────────────────────────────
 * A plain `fetch` to `/api/contact`. No `<form action>` and no Server Action:
 * the route handler is the one place that is allowed to know the HubSpot
 * credentials, and keeping the submission an ordinary POST keeps that boundary
 * obvious. The browser never contacts HubSpot, loads no HubSpot script and
 * therefore sets no HubSpot cookie — see the long note in
 * `src/app/api/contact/route.ts` for why that is a legal requirement here and
 * not a preference.
 *
 * ── VALIDATION ─────────────────────────────────────────────────────────────
 * The rules live in `@/lib/contact` and are the same object the server runs, so
 * the two can't drift. The schema yields message *keys*; this component turns
 * them into sentences with next-intl. That is also why a 400 from the server
 * can be rendered inline in the visitor's language — it comes back as keys.
 *
 * Errors appear on submit, not on keystroke: telling somebody their email is
 * invalid while they are still typing the third character of it is noise. Once
 * a field has been marked invalid it re-checks as they fix it, so the error
 * clears the moment it stops being true.
 */

type Status = 'idle' | 'submitting' | 'success' | 'error'

/** `<input type="date">` speaks `YYYY-MM-DD`, and so does the schema. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function ContactForm() {
  const t = useTranslations('ContactForm')

  const [values, setValues] = useState<ContactValues>(EMPTY_CONTACT)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<Status>('idle')
  // A form-level message key: the reason the whole submission failed, as
  // opposed to a single field. Rendered above the submit button.
  const [formError, setFormError] = useState<string | null>(null)

  // Set once the first submit has been rejected. Until then, no field is
  // re-validated as it changes — the form stays quiet while it is being filled
  // in for the first time.
  const [submitted, setSubmitted] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  // Uncontrolled on purpose: this component must never write to the honeypot,
  // so it reads the DOM node at submit time instead of holding its value in
  // state alongside the real fields.
  const honeypotRef = useRef<HTMLInputElement>(null)

  // Ids have to be unique in the document and stable across hydration.
  const uid = useId()
  const fieldId = (name: string) => `${uid}-${name}`
  const errorId = (name: string) => `${uid}-${name}-error`

  /**
   * Updates one field, and re-runs validation for that field alone once the
   * form has been submitted at least once. Validating the whole form on every
   * keystroke would light up fields the visitor has not reached yet.
   */
  function update<K extends keyof ContactValues>(
    name: K,
    value: ContactValues[K],
  ) {
    const next = { ...values, [name]: value }
    setValues(next)

    if (!submitted) return

    const result = validateContact(next)
    setErrors((previous) => ({
      ...previous,
      [name]: result.success ? undefined : result.errors[name],
    }))
  }

  /** Moves focus to the first field the visitor needs to fix. */
  function focusFirstError(fieldErrors: FieldErrors) {
    const first = ORDER.find((name) => fieldErrors[name])
    if (!first) return

    const node = formRef.current?.elements.namedItem(first)
    if (node instanceof HTMLElement) node.focus()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // The whole point: no native navigation, no form action.
    event.preventDefault()

    setSubmitted(true)
    setFormError(null)

    // Client-side gate. The consent box is part of this, so an unticked box
    // never reaches the network — `consent` is `z.literal(true)` in the schema.
    const result = validateContact(values)
    if (!result.success) {
      setErrors(result.errors)
      setStatus('error')
      setFormError('validation')
      focusFirstError(result.errors)
      return
    }

    setErrors({})
    setStatus('submitting')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          // The honeypot travels under its own name; see the hidden input.
          website: honeypotRef.current?.value ?? '',
        }),
      })

      const data: unknown = await response.json().catch(() => null)
      const payload = (data ?? {}) as {
        ok?: boolean
        error?: string
        fieldErrors?: FieldErrors
      }

      if (response.ok && payload.ok) {
        setStatus('success')
        // Clear on success only. An error leaves every value untouched, because
        // asking somebody to retype a long enquiry is how you lose it.
        setValues(EMPTY_CONTACT)
        setErrors({})
        setSubmitted(false)
        // Move focus to the confirmation: the form has just been removed from
        // the page and focus would otherwise fall back to <body>.
        requestAnimationFrame(() => successRef.current?.focus())
        return
      }

      // A rejected submission. `fieldErrors` are message keys, so they render in
      // the right language without the server knowing what that language is.
      if (payload.fieldErrors) {
        setErrors(payload.fieldErrors)
        focusFirstError(payload.fieldErrors)
      }

      setStatus('error')
      setFormError(payload.error ?? 'server')
    } catch {
      // Offline, DNS, aborted — never a HubSpot detail, which the route handler
      // keeps in its own logs.
      setStatus('error')
      setFormError('network')
    }
  }

  const pending = status === 'submitting'

  // --- success ------------------------------------------------------------
  // Replaces the form outright rather than sitting above it: the enquiry is
  // sent, and leaving a filled-in form on screen invites a second copy.
  if (status === 'success') {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="border-jb-500 bg-jb-50/60 rounded-sm border-l-2 p-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700"
      >
        <h3 className="font-display text-h3 text-ink font-medium">
          {t('successTitle')}
        </h3>
        <p className="text-body text-ink-body mt-2">{t('successBody')}</p>

        <button
          type="button"
          onClick={() => {
            setStatus('idle')
            setFormError(null)
          }}
          className="text-small text-jb-700 mt-6 rounded-xs font-semibold tracking-wide underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700"
        >
          {t('successAgain')}
        </button>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      {/* `noValidate` turns off the browser's own bubbles. They cannot be
          translated to match the page, styled, or read in a predictable order,
          and we already have better messages in the right language. */}

      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <Field
          name="firstName"
          label={t('firstName')}
          required
          error={errors.firstName}
          fieldId={fieldId}
          errorId={errorId}
          t={t}
        >
          <input
            type="text"
            name="firstName"
            id={fieldId('firstName')}
            value={values.firstName}
            onChange={(event) => update('firstName', event.target.value)}
            autoComplete="name"
            maxLength={100}
            disabled={pending}
            aria-invalid={errors.firstName ? true : undefined}
            aria-describedby={errors.firstName ? errorId('firstName') : undefined}
            className={inputClass(Boolean(errors.firstName))}
          />
        </Field>

        <Field
          name="lastName"
          label={t('lastName')}
          required
          error={errors.lastName}
          fieldId={fieldId}
          errorId={errorId}
          t={t}
        >
          <input
            type="text"
            name="lastName"
            id={fieldId('lastName')}
            value={values.lastName}
            onChange={(event) => update('lastName', event.target.value)}
            autoComplete="name"
            maxLength={100}
            disabled={pending}
            aria-invalid={errors.lastName ? true : undefined}
            aria-describedby={errors.lastName ? errorId('lastName') : undefined}
            className={inputClass(Boolean(errors.lastName))}
          />
        </Field>

        <Field
          name="email"
          label={t('email')}
          required
          error={errors.email}
          fieldId={fieldId}
          errorId={errorId}
          t={t}
        >
          <input
            // `type="email"` for the mobile keyboard. The actual rule is the
            // schema's — this attribute is a hint, not a guarantee.
            type="email"
            name="email"
            id={fieldId('email')}
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
            autoComplete="email"
            maxLength={200}
            disabled={pending}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? errorId('email') : undefined}
            className={inputClass(Boolean(errors.email))}
          />
        </Field>

        <Field
          name="phone"
          label={t('phone')}
          error={errors.phone}
          fieldId={fieldId}
          errorId={errorId}
          t={t}
        >
          <input
            type="tel"
            name="phone"
            id={fieldId('phone')}
            value={values.phone}
            onChange={(event) => update('phone', event.target.value)}
            autoComplete="tel"
            maxLength={40}
            disabled={pending}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? errorId('phone') : undefined}
            className={inputClass(Boolean(errors.phone))}
          />
        </Field>

        <Field
          name="companyName"
          label={t('companyName')}
          error={errors.companyName}
          fieldId={fieldId}
          errorId={errorId}
          t={t}
        >
          <input
            type="text"
            name="companyName"
            id={fieldId('companyName')}
            value={values.companyName}
            onChange={(event) => update('companyName', event.target.value)}
            autoComplete="organization"
            maxLength={120}
            disabled={pending}
            aria-invalid={errors.companyName ? true : undefined}
            aria-describedby={errors.companyName ? errorId('companyName') : undefined}
            className={inputClass(Boolean(errors.companyName))}
          />
        </Field>

        <Field
          name="eventType"
          label={t('eventType')}
          error={errors.eventType}
          fieldId={fieldId}
          errorId={errorId}
          t={t}
        >
          <select
            name="eventType"
            id={fieldId('eventType')}
            value={values.eventType}
            onChange={(event) => update('eventType', event.target.value)}
            disabled={pending}
            aria-invalid={errors.eventType ? true : undefined}
            aria-describedby={
              errors.eventType ? errorId('eventType') : undefined
            }
            className={inputClass(Boolean(errors.eventType))}
          >
            {/* The empty option is the default and stays selectable, because
                the field is optional — this is not a "please choose" prompt
                that has to be cleared. */}
            <option value="">{t('eventTypePlaceholder')}</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`eventTypes.${type}`)}
              </option>
            ))}
          </select>
        </Field>

        <Field
          name="eventDate"
          label={t('eventDate')}
          error={errors.eventDate}
          fieldId={fieldId}
          errorId={errorId}
          t={t}
        >
          <input
            type="date"
            name="eventDate"
            id={fieldId('eventDate')}
            value={values.eventDate}
            onChange={(event) => update('eventDate', event.target.value)}
            // Nudges the native picker past dates the schema would reject
            // anyway. Not a substitute for the rule.
            min={todayIso()}
            disabled={pending}
            aria-invalid={errors.eventDate ? true : undefined}
            aria-describedby={errors.eventDate ? errorId('eventDate') : undefined}
            className={inputClass(Boolean(errors.eventDate))}
          />
        </Field>

        <Field
          name="attendees"
          label={t('attendees')}
          error={errors.attendees}
          fieldId={fieldId}
          errorId={errorId}
          t={t}
        >
          <input
            type="number"
            name="attendees"
            id={fieldId('attendees')}
            value={values.attendees}
            onChange={(event) => update('attendees', event.target.value)}
            min={1}
            max={100000}
            step={1}
            inputMode="numeric"
            disabled={pending}
            aria-invalid={errors.attendees ? true : undefined}
            aria-describedby={
              errors.attendees ? errorId('attendees') : undefined
            }
            className={inputClass(Boolean(errors.attendees))}
          />
        </Field>

        <Field
          name="cityOfEvent"
          label={t('cityOfEvent')}
          error={errors.cityOfEvent}
          fieldId={fieldId}
          errorId={errorId}
          t={t}
        >
          <input
            type="text"
            name="cityOfEvent"
            id={fieldId('cityOfEvent')}
            value={values.cityOfEvent}
            onChange={(event) => update('cityOfEvent', event.target.value)}
            autoComplete="city"
            maxLength={100}
            disabled={pending}
            aria-invalid={errors.cityOfEvent ? true : undefined}
            aria-describedby={errors.cityOfEvent ? errorId('cityOfEvent') : undefined}
            className={inputClass(Boolean(errors.cityOfEvent))}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field
            name="message"
            label={t('message')}
            required
            error={errors.message}
            fieldId={fieldId}
            errorId={errorId}
            t={t}
          >
            <textarea
              name="message"
              id={fieldId('message')}
              value={values.message}
              onChange={(event) => update('message', event.target.value)}
              rows={5}
              maxLength={3000}
              disabled={pending}
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={errors.message ? errorId('message') : undefined}
              className={`${inputClass(Boolean(errors.message))} resize-y`}
            />
          </Field>
        </div>
      </div>

      {/* --- honeypot ---------------------------------------------------
          Invisible to people, irresistible to the kind of bot that fills in
          every input it can find. The server treats any value here as spam.

          Hidden with `absolute + opacity-0` rather than `display:none`, since
          the cruder scrapers skip anything that is display:none and would walk
          straight past it. `aria-hidden` and `tabIndex={-1}` keep it away from
          screen readers and the tab order, and the label is what a naive bot
          matches on. Never given a value by this component. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor={fieldId('website')}>Website</label>
        <input
          ref={honeypotRef}
          type="text"
          id={fieldId('website')}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {/* --- RGPD consent -------------------------------------------------
          Never pre-ticked: `EMPTY_CONTACT.consent` is `false` and nothing here
          sets it otherwise. Pre-ticking would not be valid consent under the
          RGPD, and the privacy policy names this box as the art. 6.1.a legal
          basis for holding the enquiry at all.

          The link sits inside the <label> on purpose and this is safe: the HTML
          spec suppresses a label's activation behaviour when the click targets
          an interactive descendant, so opening the privacy policy does not also
          tick the box. */}
      <div className="mt-8">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            name="consent"
            id={fieldId('consent')}
            checked={values.consent}
            onChange={(event) => update('consent', event.target.checked)}
            disabled={pending}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={`${fieldId('consent-hint')}${errors.consent ? ` ${errorId('consent')}` : ''}`}
            className="accent-jb-600 mt-1 h-4 w-4 shrink-0 rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700"
          />

          <div>
            <label
              htmlFor={fieldId('consent')}
              className="text-small text-ink-body"
            >
              {t.rich('consent', {
                link: (chunks) => (
                  <Link
                    href="/privacy"
                    className="text-jb-700 rounded-xs font-medium underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700"
                  >
                    {chunks}
                  </Link>
                ),
              })}{' '}
              <span aria-hidden="true" className="text-jb-700">
                *
              </span>
              <span className="sr-only">({t('required')})</span>
            </label>

            <p
              id={fieldId('consent-hint')}
              className="text-small text-ink-muted mt-1"
            >
              {t('consentHint')}
            </p>

            {errors.consent && (
              <p
                id={errorId('consent')}
                className="text-small mt-2 font-medium text-red-700"
              >
                {t(`errors.${errors.consent}`)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Form-level failure. `role="alert"` so it is announced when it appears
          — the visitor may well have been looking at the button, not here. */}
      {status === 'error' && formError && (
        <div
          role="alert"
          className="text-small mt-6 rounded-sm border-l-2 border-red-700 bg-red-50 p-4 text-red-900"
        >
          <p className="font-semibold">{t('errorTitle')}</p>
          <p className="mt-1">{t(`errors.${formError}`)}</p>
        </div>
      )}

      <div className="mt-8 flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-jb-700 text-small rounded-sm px-8 py-3 font-semibold tracking-wide text-white transition-colors hover:bg-jb-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? t('submitting') : t('submit')}
        </button>

        {/* The disabled button already says "Enviando…", but a disabled control
            is skipped by some screen readers, so the state is mirrored into a
            live region that is not disabled. */}
        <span aria-live="polite" className="sr-only">
          {pending ? t('submitting') : ''}
        </span>
      </div>
    </form>
  )
}

/**
 * Focus order for `focusFirstError` — the visual order of the fields, so focus
 * lands on the first problem the visitor can see rather than the first one the
 * object happens to list.
 */
const ORDER = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'companyName',
  'eventType',
  'eventDate',
  'attendees',
  'cityOfEvent',
  'message',
  'consent',
] as const satisfies readonly (keyof FieldErrors)[]

function inputClass(invalid: boolean) {
  return [
    'w-full rounded-sm border bg-white px-3 py-2.5 text-body text-ink',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700',
    'disabled:cursor-not-allowed disabled:opacity-60',
    // Colour is not the only signal: the field also gets `aria-invalid` and a
    // written message underneath it.
    invalid ? 'border-red-700' : 'border-line',
  ].join(' ')
}

/**
 * Label + control + error message, so the wiring between the three (`htmlFor`,
 * `aria-describedby`, the id of the error paragraph) is written once instead of
 * nine times. The control itself is passed in as children because each one
 * needs different attributes.
 */
function Field({
  name,
  label,
  required = false,
  error,
  fieldId,
  errorId,
  t,
  children,
}: {
  name: string
  label: string
  required?: boolean
  error?: string
  fieldId: (name: string) => string
  errorId: (name: string) => string
  t: (key: string) => string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={fieldId(name)}
        className="text-small text-ink-body block font-medium"
      >
        {label}{' '}
        {required ? (
          <>
            {/* The asterisk is decorative; the requirement is stated in words
                for anyone who cannot see it, and enforced by the schema. */}
            <span aria-hidden="true" className="text-jb-700">
              *
            </span>
            <span className="sr-only">({t('required')})</span>
          </>
        ) : (
          <span className="text-ink-muted font-normal">({t('optional')})</span>
        )}
      </label>

      <div className="mt-1.5">{children}</div>

      {error && (
        <p
          id={errorId(name)}
          className="text-small mt-1.5 font-medium text-red-700"
        >
          {t(`errors.${error}`)}
        </p>
      )}
    </div>
  )
}
