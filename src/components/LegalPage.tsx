import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'

import { routing } from '@/i18n/routing'
import PortableText from '@/components/PortableText'
import { pickLocale, pickLocaleArray, type Locale } from '@/sanity/lib/locale'
import { getLegalPage } from '@/sanity/lib/queries'

/**
 * The body of every legal page — aviso legal, privacidad, cookies.
 *
 * Server Component. The three routes differ only by slug, so they are three
 * thin files that call in here rather than three copies of the same fetch,
 * fallback and layout logic. Getting the RGPD retention wording right once is
 * hard enough; getting it right in triplicate and keeping it that way is not a
 * thing to rely on.
 *
 * NOTHING FISCAL IS HARDCODED HERE. The company name, NIF, registered address
 * and the contact address for exercising rights all live in the Sanity
 * document's body, because they are legally significant and must be correctable
 * without a deploy. This file knows how to lay out a legal page and nothing
 * about what one says.
 */

/**
 * The Sanity slugs. These are the `slug.current` values on the `legalPage`
 * documents, NOT the URL segments a visitor sees — those are localised by
 * `routing.pathnames` (/es/privacidad, /en/privacy) and both map onto the same
 * single document.
 *
 * Note for whoever creates these documents: `legalPage.slug` generates from
 * `title.es`, so the Studio will propose "aviso-legal" and "politica-de-
 * privacidad". They must be set to the values below instead, or the fetch
 * returns null and the route 404s.
 */
export type LegalSlug = 'legal-notice' | 'privacy' | 'cookies'

/**
 * Next types a route param as `string`; `Locale` is `'es' | 'en'`. Narrowing
 * once here keeps the cast out of all three page files.
 *
 * The layout above has already called `notFound()` for anything that is not a
 * known locale, so the fallback is unreachable in practice — it exists so this
 * function is total rather than relying on that guarantee from a distance.
 */
function toLocale(value: string): Locale {
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale
}

/**
 * Sanity's `date` type stores a bare `YYYY-MM-DD`.
 *
 * `new Date('2026-01-15')` is parsed as UTC midnight, so formatting it in any
 * timezone behind UTC prints the previous day — "última actualización" would be
 * off by one for a visitor in the Americas. Pinning the format to UTC keeps the
 * printed date identical to the one the editor typed, everywhere.
 */
function formatLastUpdated(value: string, locale: Locale): string | null {
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(date)
}

/**
 * Shared `generateMetadata` body. Returns an empty object when the document is
 * missing rather than inventing a title — the page itself will 404, and a 404
 * should not carry the title of a page that does not exist.
 */
export async function legalPageMetadata(
  slug: LegalSlug,
  localeParam: string,
): Promise<Metadata> {
  const locale = toLocale(localeParam)
  const page = await getLegalPage(slug)
  const title = pickLocale(page?.title, locale)

  return title === '' ? {} : { title }
}

export default async function LegalPage({
  slug,
  locale: localeParam,
}: {
  slug: LegalSlug
  locale: string
}) {
  // No `setRequestLocale` here. The [locale] layout above already sets it for
  // this request, which is what `getTranslations` reads — the same arrangement
  // the home page and its sections rely on. next-intl also marks that function
  // deprecated, and the layout explains why it cannot move to `next/root-params`
  // yet, so there is no reason to add two more call sites for it.
  const locale = toLocale(localeParam)

  const [t, page] = await Promise.all([
    getTranslations('Legal'),
    getLegalPage(slug),
  ])

  // No document means the policy has not been written yet. A legal page that
  // renders its chrome with an empty middle looks published and says nothing,
  // which is worse than admitting it is not there.
  if (!page) notFound()

  const title = pickLocale(page.title, locale)
  const body = pickLocaleArray(page.body, locale)

  const rawDate = page.lastUpdated ?? null
  const lastUpdated = rawDate ? formatLastUpdated(rawDate, locale) : null

  return (
    // `pt-18` clears the fixed header, which is out of flow and reserves no
    // space of its own. `max-w-2xl` is the reading column: narrower than the
    // 6xl the home-page sections use, because this is continuous prose rather
    // than a layout.
    <article className="mx-auto max-w-2xl px-4 pt-18 sm:px-6">
      <div className="py-[clamp(4rem,10vh,7rem)]">
        <h1 className="font-display text-h2 text-ink font-light text-balance">
          {title}
        </h1>

        <div className="mt-10">
          <PortableText value={body} locale={locale} />
        </div>

        {rawDate && lastUpdated && (
          // Last, as it is in the source documents, and set off by a rule: it
          // is metadata about the text rather than part of it. `<time>` carries
          // the machine-readable date the editor actually entered.
          <p className="text-small text-ink-muted border-line mt-16 border-t pt-6">
            {t('lastUpdated')}:{' '}
            <time dateTime={rawDate}>{lastUpdated}</time>
          </p>
        )}
      </div>
    </article>
  )
}
