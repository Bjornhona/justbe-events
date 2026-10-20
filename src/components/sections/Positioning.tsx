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
        {/* Offset rather than centred: the claim sits in the right two-thirds
            of a 12-column grid (columns 5–12), so the empty third on the left
            is doing the work that centring used to. Collapses to one full-width
            column below md — the offset reads as a broken margin on a phone.

            No `ch` max-width. On desktop the column is the measure (8/12 of a
            1104px container, so ~720px less the gap); below md the container
            is. A `40ch` cap would bind at the tablet end and go inert at the
            desktop end, because Satoshi's zero is 0.683em and `text-h3` tops
            out at 32px — 40ch is ~865px there, wider than the column. */}
        <div className="md:grid md:grid-cols-12">
          <p className="text-h3 text-ink text-pretty md:col-span-8 md:col-start-5">
            {t('body')}
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
