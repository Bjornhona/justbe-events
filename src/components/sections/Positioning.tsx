import { getTranslations } from 'next-intl/server'

import Reveal from '@/components/Reveal'
import Section from '@/components/Section'

/**
 * Server Component. The claim the rest of the page has to earn, set alone on
 * its band so there is nothing to read it against.
 *
 * `id` is not in `SECTIONS` — this is not a nav target. It carries one anyway
 * because `Section` needs it, and because a stable fragment is useful to link
 * to from outside.
 */
export default async function Positioning() {
  const t = await getTranslations('Positioning')

  return (
    <Section id="posicionamiento" tone="alt">
      <Reveal>
        {/* `text-pretty`, not `text-balance`: balancing is for headings of a
            few words and gives a paragraph this long an uneven rag. */}
        <p className="text-h3 text-ink mx-auto max-w-[40ch] text-center text-pretty">
          {t('body')}
        </p>
      </Reveal>
    </Section>
  )
}
