import { getLocale } from 'next-intl/server'

import Reveal from '@/components/Reveal'
import Section from '@/components/Section'
import { client } from '@/sanity/lib/client'
import { pickLocale, type Locale } from '@/sanity/lib/locale'
import {
  featuredProjectsQuery,
  type FeaturedProjectsQueryResult,
} from '@/sanity/lib/queries'

/** The grid is drawn for four. A fifth featured project is a Studio mistake,
 *  not a layout mode, so it is dropped rather than allowed to unbalance the row. */
const MAX_CARDS = 4

/**
 * Server Component. Typographic cards: they have to carry the section on their
 * own, because there is no photography yet and the placeholder images in the
 * dataset are stand-ins (`isPlaceholder`) that would be worse than nothing.
 *
 * The cards are deliberately not links. There are no project pages to link to,
 * and a card that looks clickable and is not is worse than one that never
 * suggested it — hence no hover lift and no modal either.
 */
export default async function Work() {
  const [requestedLocale, projects] = await Promise.all([
    getLocale(),
    client.fetch<FeaturedProjectsQueryResult>(
      featuredProjectsQuery,
      {},
      { next: { revalidate: 300 } },
    ),
  ])

  const locale: Locale = requestedLocale === 'en' ? 'en' : 'es'

  // The dataset is empty today. An empty band of `paper-alt` with nothing in it
  // reads as a broken page, so the section removes itself instead.
  if (projects.length === 0) return null

  return (
    <Section id="section-projects" tone="alt">
      <Reveal>
        {/* A 12-column grid on desktop, where cards alternate 7 and 5 columns
            so each row sums to 12 and no two rows break at the same place. The
            narrow card in each pair also sits 4rem lower, which is what stops
            the two rows reading as a table. One full-width column below md:
            both the 7/5 split and the offset read as a misalignment on a phone
            rather than as a composition. */}
        <div className="grid gap-x-12 gap-y-16 md:grid-cols-12">
          {projects.slice(0, MAX_CARDS).map((project, i) => {
            const meta = [project.city, project.year].filter(Boolean).join(' · ')

            // Even cards take 7 columns, odd take 5 and drop 4rem. The offset
            // rides along with the narrow card rather than being tracked
            // separately, so the two rules cannot drift apart.
            const narrow = i % 2 === 1

            // `client` is only in the payload when the brand gave written
            // permission — `featuredProjectsQuery` gates it, so there is no
            // check to repeat here. Blank-but-present still falls back.
            const attribution = project.client?.trim()
              ? project.client
              : pickLocale(project.anonymousLabel, locale)

            return (
              <article
                key={project._id}
                className={[
                  // `min-w-0` overrides the `min-width: auto` a grid item gets
                  // by default, which would otherwise let a long unbreakable
                  // word widen its own track and push the row past the
                  // container. Today's longest is "arquitectura" (~407px at
                  // the 72px h2 ceiling) inside a 432px five-column track, so
                  // nothing overflows — but that is a 25px margin held by the
                  // copy, not by the layout, and this makes it the layout's.
                  'border-jb-500 relative min-w-0 border-t-2 pt-6',
                  narrow ? 'md:col-span-5 md:mt-16' : 'md:col-span-7',
                ].join(' ')}
              >
                {/* BACKGROUND IMAGE LAYER — when real photography arrives.
                    Add it here, as the first child, absolutely positioned to
                    fill this <article> with the type layered over it:

                      <div className="absolute inset-0 -z-10">
                        <Image src={urlFor(project.heroImage)...} fill ... />
                      </div>

                    The <article> is already `relative` for exactly this. Two
                    things to settle at that point: the card will need its own
                    text colour once it sits on a photograph rather than on
                    paper, and `isPlaceholder` should keep stand-in images out
                    until the real shoot lands. */}

                {/* `text-balance`, not `text-pretty`: these are three or four
                    words in a narrow column, which is what balancing is for.
                    It keeps the conjunction at the head of a line on three of
                    the four seeded cards ("Celebración / y conserjería").

                    It does NOT fix the fourth, and no wrapping property will.
                    "Convención y arquitectura efímera" in a five-column card
                    is a geometry problem: at the 72px `--text-h2` ceiling the
                    track is 432px, "Convención y" measures 435.7px and
                    "y arquitectura" 457.1px, so the "y" fits on neither
                    neighbour's line and is forced to stand alone. It misses by
                    4px. Closing that gap means a smaller step for card
                    headings or a wider track — not a hint here. */}
                <h2 className="font-display text-h2 text-ink font-light text-balance">
                  {pickLocale(project.eventType, locale)}
                </h2>

                {meta !== '' && (
                  <p className="text-small text-ink-muted mt-2">{meta}</p>
                )}

                <p className="text-body text-ink-body mt-4">{attribution}</p>
              </article>
            )
          })}
        </div>
      </Reveal>
    </Section>
  )
}
