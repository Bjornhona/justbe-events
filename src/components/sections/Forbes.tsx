import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'

import Reveal from '@/components/Reveal'
import Section from '@/components/Section'
import { client } from '@/sanity/lib/client'
import { imageSource, urlFor } from '@/sanity/lib/image'
import { pickLocale, pickLocaleOrNull, type Locale } from '@/sanity/lib/locale'
import {
  siteSettingsQuery,
  type SiteSettingsQueryResult,
} from '@/sanity/lib/queries'

/** The portrait is cropped to 4:5 and never rendered wider than this. */
const PORTRAIT_WIDTH = 320
const PORTRAIT_RATIO = 5 / 4

/**
 * Server Component. The one piece of outside proof on the page, so it gets a
 * band of its own rather than a logo strip.
 *
 * `quote` is the section's switch: no quote, no section. The other three fields
 * each degrade on their own — a quote with no link is still worth printing, a
 * quote with nobody's name on it is not much less so, and the portrait is
 * decoration. Only the quote carries the claim.
 */
export default async function Forbes() {
  const [t, requestedLocale, settings] = await Promise.all([
    getTranslations('Forbes'),
    getLocale(),
    // Matches Footer and Pillars: plain `client.fetch` with `revalidate`,
    // because `sanityFetch` needs <SanityLive /> mounted in the layout and it
    // is not.
    client.fetch<SiteSettingsQueryResult>(
      siteSettingsQuery,
      {},
      { next: { revalidate: 300 } },
    ),
  ])

  const locale: Locale = requestedLocale === 'en' ? 'en' : 'es'

  const press = settings?.press
  // `pickLocaleOrNull`, not `pickLocale`: an untranslated quote falls back to
  // Spanish, and only a quote that exists in neither language removes the band.
  const quote = pickLocaleOrNull(press?.quote, locale)

  if (!quote) return null

  const portrait = imageSource(press?.portrait)
  const sourceUrl = press?.sourceUrl?.trim()

  return (
    <Section id="prensa" tone="alt">
      <Reveal>
        {/* Portrait first in the DOM, which is also where it belongs on mobile
            — above the quote. `md:flex-row` then puts it alongside on desktop
            without a reversal, so reading order and visual order never split. */}
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:gap-16">
          {portrait && (
            <Image
              src={urlFor(portrait)
                .width(PORTRAIT_WIDTH * 2)
                .height(Math.round(PORTRAIT_WIDTH * PORTRAIT_RATIO * 2))
                .fit('crop')
                .auto('format')
                .url()}
              // Empty alt when the Studio field is blank, which marks the
              // portrait decorative and lets a screen reader skip straight to
              // the quote. That is the right default here: the quote is the
              // content, and an invented "portrait of the founder" would be
              // noise rather than information.
              alt={pickLocale(press?.portrait?.alt, locale)}
              width={PORTRAIT_WIDTH}
              height={Math.round(PORTRAIT_WIDTH * PORTRAIT_RATIO)}
              sizes={`(min-width: 768px) ${PORTRAIT_WIDTH}px, 100vw`}
              className="w-full max-w-xs object-cover md:shrink-0"
            />
          )}

          <div>
            <p className="text-small text-ink-muted font-semibold tracking-widest uppercase">
              {t('eyebrow')}
            </p>

            {/* No quotation marks around the quote: Spanish sets them as «»
                and English as “”, so a hardcoded pair would be wrong in one
                language or the other. The display type and the eyebrow above
                already mark this as quoted. */}
            <blockquote cite={sourceUrl} className="mt-6">
              <p className="font-display text-h2 text-ink font-light text-pretty">
                {quote}
              </p>
            </blockquote>

            {/* Outside the <blockquote>, where the HTML spec puts attribution:
                the source's name is about the quote, not part of it. */}
            {press?.sourceName && (
              <p className="text-small text-ink-muted mt-8">
                {press.sourceName}
              </p>
            )}

            {sourceUrl && (
              <p className="mt-3">
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-jb-700 text-small rounded-xs underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                >
                  {t('readArticle')}
                </a>
              </p>
            )}
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
