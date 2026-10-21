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
 *
 * ── THE THREE NAMES ARE ENGLISH IN BOTH CATALOGUES ────────────────────────
 * `Pillars.*.name` reads "Imagine" / "Build" / "Live" on /es as well as /en.
 * That is not an untranslated string waiting to be finished — it is brand
 * vocabulary, the same category as the hero eyebrow, which is also English on
 * /es for the same reason. Do not "fix" it in `messages/es.json`.
 *
 * It also removes a layout failure rather than papering over one. The Spanish
 * names overflowed their grid tracks at every desktop width: "Construimos"
 * needs ~424px of ink against a ~270px track, so its glyphs ran 97px past the
 * column and collided with "Vivimos" by 56px at 1440. Because `grid-cols-3`
 * compiles to `minmax(0, 1fr)`, the track never widened and nothing scrolled —
 * the words simply overlapped, and only Range client rects showed it
 * (`getBoundingClientRect` returns the block box, which is clipped to the
 * track and looked innocent). No type-size reduction survived that gap.
 *
 * The DESCRIPTIONS and the service lists below them stay translated. Only the
 * three names are fixed.
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
    <Section id="section-services" tone="paper">
      {/* The grid is on `Reveal` so the three columns are its direct children
          and can be staggered individually — see `Reveal`. */}
      <Reveal stagger className="grid gap-16 md:grid-cols-3 md:gap-0">
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
                  // The middle column drops 2rem so the three headings do not
                  // read as one ruled row. Its left-hand rule drops with it,
                  // which is the point — the verticals are meant to step.
                  i === 1 ? 'md:mt-8' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {/* jb-600, not the jb-700 used for links: these are the
                    largest teal elements on the page and the strongest place
                    to carry brand colour, and at `--text-h2` they are 36px at
                    the floor and 72px at the ceiling. That is WCAG "large
                    text" at every viewport, so the 3:1 threshold applies and
                    jb-600 clears it at 3.64:1 on paper.

                    Do not reuse this colour at body size — jb-600 is 3.64:1,
                    well under the 4.5:1 that text under 24px needs. The margin
                    is also thinner than it looks: on `paper-alt` the same
                    colour is 3.31:1, so moving this section to the alt tone
                    leaves only 0.31 of headroom. */}
                <h2 className="font-display text-h2 text-jb-600 font-light">
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
      </Reveal>
    </Section>
  )
}
