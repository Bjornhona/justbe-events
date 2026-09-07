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
    <Section id="proyectos" tone="alt">
      <Reveal>
        <div className="grid gap-x-12 gap-y-16 sm:grid-cols-2">
          {projects.slice(0, MAX_CARDS).map((project) => {
            const meta = [project.city, project.year].filter(Boolean).join(' · ')

            // `client` is only in the payload when the brand gave written
            // permission — `featuredProjectsQuery` gates it, so there is no
            // check to repeat here. Blank-but-present still falls back.
            const attribution = project.client?.trim()
              ? project.client
              : pickLocale(project.anonymousLabel, locale)

            return (
              <article
                key={project._id}
                className="border-jb-500 relative border-t-2 pt-6"
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

                <h2 className="font-display text-h2 text-ink font-light">
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
