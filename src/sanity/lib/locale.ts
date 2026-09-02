/**
 * Reading the `localeString` / `localeText` objects from the CMS.
 *
 * Spanish is the source language: Barbara writes it, and it is the one field
 * validation insists on. English is added later, field by field. So a document
 * is routinely half-translated, and the site must not render a blank heading
 * because nobody has got round to the English yet — it falls back to Spanish.
 */

/** The locales `next-intl` routes on, and the keys in every locale object. */
export type Locale = 'es' | 'en'

export const DEFAULT_LOCALE: Locale = 'es'

/** Shape of the `localeString` and `localeText` schema objects. */
export type LocaleString = {
  [K in Locale]?: string | null
}

export type LocaleText = LocaleString

/**
 * Returns `field[locale]`, falling back to Spanish when the requested value is
 * missing or blank, and to `''` when neither exists.
 *
 * Returning `''` rather than `undefined` keeps this safe to drop straight into
 * JSX: an untranslated field renders as nothing instead of "undefined".
 */
export function pickLocale(
  field: LocaleString | null | undefined,
  locale: Locale,
): string {
  if (!field) return ''

  const requested = field[locale]
  if (requested && requested.trim() !== '') return requested

  const fallback = field[DEFAULT_LOCALE]
  if (fallback && fallback.trim() !== '') return fallback

  return ''
}

/**
 * Same fallback rule, but tells you whether anything was found at all — for the
 * places where an empty value should hide the whole element rather than render
 * an empty one.
 */
export function pickLocaleOrNull(
  field: LocaleString | null | undefined,
  locale: Locale,
): string | null {
  const value = pickLocale(field, locale)
  return value === '' ? null : value
}
