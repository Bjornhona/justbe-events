import { getTranslations } from 'next-intl/server'

import Reveal from '@/components/Reveal'
import Section from '@/components/Section'
import { client } from '@/sanity/lib/client'
import {
  siteSettingsQuery,
  type SiteSettingsQueryResult,
} from '@/sanity/lib/queries'

const LINK_CLASS =
  'rounded-xs underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700'

/**
 * Server Component. The end of the page and the point of it — `contacto` is
 * where the hero's call to action lands, so the id has to match `SECTIONS`.
 *
 * The direct details sit beside the form rather than replacing it: a form is
 * easier for someone briefing an event, and an address is easier for someone
 * who already knows what they want to say. Neither is the fallback for the
 * other, which is why both are always on screen.
 */
export default async function Contact() {
  const [t, settings] = await Promise.all([
    getTranslations('Contact'),
    // Matches Footer and Pillars: plain `client.fetch` with `revalidate`,
    // because `sanityFetch` needs <SanityLive /> mounted in the layout and it
    // is not.
    client.fetch<SiteSettingsQueryResult>(
      siteSettingsQuery,
      {},
      { next: { revalidate: 300 } },
    ),
  ])

  // The query already returns null unless the flag is on, so this cannot leak
  // Barbara's mobile on its own. It is repeated here for the same reason the
  // footer repeats it: the rule should be readable where the number is printed,
  // not only in the GROQ.
  const phone = settings?.showPhonePublicly ? settings.phone : null

  return (
    <Section id="contacto" tone="paper">
      <Reveal>
        <h2 className="font-display text-h2 text-ink max-w-[16ch] font-light text-balance">
          {t('heading')}
        </h2>

        <div className="mt-12 grid gap-12 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-16">
          <div>
            {/* FORM GOES HERE — built in the next step. It owns this column;
                the details beside it are deliberately not part of it. */}
          </div>

          <div>
            <h3 className="text-small text-ink-muted font-semibold tracking-widest uppercase">
              {t('directHeading')}
            </h3>

            {/* Every entry is optional, because the singleton can be — and is —
                half-filled. The list renders whatever is there. */}
            <ul className="text-body text-ink-body mt-4 flex flex-col gap-2">
              {settings?.email && (
                <li>
                  <a href={`mailto:${settings.email}`} className={LINK_CLASS}>
                    {settings.email}
                  </a>
                </li>
              )}

              {settings?.whatsapp && (
                <li>
                  <a
                    href={settings.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={LINK_CLASS}
                  >
                    {t('whatsappLabel')}
                  </a>
                </li>
              )}

              {phone && (
                <li>
                  {/* `tel:` will not tolerate the spaces the number is written
                      with in the Studio, so strip them from the href only. */}
                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className={LINK_CLASS}
                  >
                    {phone}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
