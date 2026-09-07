import { getLocale, getTranslations } from 'next-intl/server'

import Reveal from '@/components/Reveal'
import Section from '@/components/Section'
import { client } from '@/sanity/lib/client'
import { pickLocale, type Locale } from '@/sanity/lib/locale'
import {
  servicesQuery,
  type Pillar,
  type ServicesQueryResult,
} from '@/sanity/lib/queries'

/**
 * Narrative order, not alphabetical. `servicesQuery` ranks the same way, but
 * the grouping below does not lean on that: the columns are the brand's three
 * pillars whether or not the dataset has a service in each.
 */
const PILLARS = ['imagine', 'build', 'live'] as const satisfies readonly Pillar[]

/**
 * Server Component.
 *
 * The pillar names and one-line descriptions come from `next-intl`, not Sanity:
 * they are the fixed structure of the offer, not content Barbara edits per
 * event. Only the services inside them are CMS-driven.
 */
export default async function Pillars() {
  const [t, requestedLocale, services] = await Promise.all([
    getTranslations('Pillars'),
    getLocale(),
    // Matches Footer: plain `client.fetch` with `revalidate`, because
    // `sanityFetch` needs <SanityLive /> mounted in the layout and it is not.
    client.fetch<ServicesQueryResult>(
      servicesQuery,
      {},
      { next: { revalidate: 300 } },
    ),
  ])

  // `getLocale()` is typed as a bare string. Narrowing rather than casting
  // keeps this total: anything unexpected falls back to Spanish, which is the
  // same rule `pickLocale` applies to the fields themselves.
  const locale: Locale = requestedLocale === 'en' ? 'en' : 'es'

  return (
    <Section id="servicios" tone="paper">
      <Reveal>
        <div className="grid gap-16 md:grid-cols-3 md:gap-0">
          {PILLARS.map((pillar, i) => {
            const items = services.filter((s) => s.pillar === pillar)

            return (
              <div
                key={pillar}
                className={[
                  // The rule sits on the column rather than between grid
                  // tracks, so it disappears with the columns on mobile.
                  i > 0 ? 'md:border-line md:border-l md:pl-10' : '',
                  i < PILLARS.length - 1 ? 'md:pr-10' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <h2 className="font-display text-h2 text-ink font-light">
                  {t(`${pillar}.name`)}
                </h2>
                <p className="text-body text-ink-muted mt-3">
                  {t(`${pillar}.description`)}
                </p>

                {items.length > 0 && (
                  <ul className="text-body text-ink-body mt-8 space-y-2">
                    {items.map((service) => (
                      <li key={service._id}>
                        {pickLocale(service.title, locale)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </Reveal>
    </Section>
  )
}
