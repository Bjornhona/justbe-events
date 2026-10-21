import { getFormatter, getTranslations } from 'next-intl/server'

import Reveal from '@/components/Reveal'
import Section from '@/components/Section'
import { client } from '@/sanity/lib/client'
import {
  siteSettingsQuery,
  type SiteSettingsQueryResult,
} from '@/sanity/lib/queries'

/**
 * The four figures, in the order they are read. Each is a key on `siteSettings`
 * and, with the same name, a label in the `Numbers` namespace — the label is
 * fixed copy ("events delivered"), not something Barbara edits per figure, so
 * only the number itself comes from the CMS.
 */
const FIGURES = [
  'yearsActive',
  'eventsDelivered',
  'attendeesTotal',
  'countriesCount',
] as const

/**
 * Server Component.
 *
 * Every figure is optional, and a number Barbara cannot stand behind is worse
 * than no number: an unfilled field drops its item, and an empty singleton
 * drops the whole band rather than leaving a stripe of paper with nothing on it.
 */
export default async function Numbers() {
  const [t, format, settings] = await Promise.all([
    getTranslations('Numbers'),
    // Formats against the request locale: 250000 reads as "250.000" in Spanish
    // and "250,000" in English. Worth it — `attendeesTotal` is the one figure
    // long enough to be misread unpunctuated.
    getFormatter(),
    // Matches Footer and Pillars: plain `client.fetch` with `revalidate`,
    // because `sanityFetch` needs <SanityLive /> mounted in the layout and it
    // is not.
    client.fetch<SiteSettingsQueryResult>(
      siteSettingsQuery,
      {},
      { next: { revalidate: 300 } },
    ),
  ])

  // `typeof === 'number'` rather than a truthiness check, so a legitimate 0
  // still renders. It is unlikely on any of these four, but "0 países" is a
  // fact and `!value` would silently swallow it.
  const figures = FIGURES.map((key) => ({ key, value: settings?.[key] })).filter(
    (figure): figure is { key: (typeof FIGURES)[number]; value: number } =>
      typeof figure.value === 'number',
  )

  if (figures.length === 0) return null

  return (
    // The one dark band on the page, and the only section whose colours are
    // inverted — see `Section` for the two rules that apply inside it. `tall`
    // is deliberate: four figures floating in a tall dark band is the effect,
    // so nothing here should grow to fill the space.
    <Section id="cifras" tone="dark" padding="tall">
      {/* A description list, because that is what this is: each number is
          described by its label. The pair is written <dt> then <dd> as the
          markup requires and flipped visually with `flex-col-reverse`, so the
          number leads on screen without the label losing its association.

          The track count is fixed at four even when fewer figures survive — a
          three-item row sitting left with a gap at the end is the same rhythm
          as the four-item row, where re-centring would not be.

          `as="dl"` keeps that semantic while letting `Reveal` be the grid, so
          the four figures are direct children and stagger one after another. */}
      <Reveal
        stagger
        as="dl"
        className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4"
      >
        {figures.map(({ key, value }) => (
          <div key={key} className="flex flex-col-reverse">
            {/* `text-paper/70` rather than a muted token: the ink-* neutrals
                are mixed for a light ground and all of them fail here. At 70%
                this measures 7.79:1 on --color-ink-deep, so the label reads as
                secondary without dropping below AA at 13px. */}
            <dt className="text-small text-paper/70 mt-3">{t(key)}</dt>
            <dd className="font-display text-h2 text-paper font-light">
              {format.number(value)}
            </dd>
          </div>
        ))}
      </Reveal>
    </Section>
  )
}
