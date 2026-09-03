import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/routing'
import { client } from '@/sanity/lib/client'
import {
  siteSettingsQuery,
  type SiteSettingsQueryResult,
} from '@/sanity/lib/queries'

const LEGAL_LINKS = [
  { href: '/legal-notice', key: 'legalNotice' },
  { href: '/privacy', key: 'privacy' },
  { href: '/cookies', key: 'cookies' },
] as const

const LINK_CLASS =
  'rounded-xs underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700'

/**
 * Server Component — no client JavaScript at all.
 *
 * Everything here comes from the `siteSettings` singleton so the fiscal data
 * and the contact details can be corrected in the Studio without a deploy. That
 * also means the dataset can be empty (it is, today), so every field is
 * optional and the footer must still render.
 */
export default async function Footer() {
  const [t, settings] = await Promise.all([
    getTranslations('Footer'),
    // Not `sanityFetch`: that needs <SanityLive /> mounted in the layout, which
    // it is not yet. `revalidate` also keeps the route on ISR, which is what
    // stops the copyright year below from freezing at build time.
    client.fetch<SiteSettingsQueryResult>(
      siteSettingsQuery,
      {},
      { next: { revalidate: 300 } },
    ),
  ])

  const year = new Date().getFullYear()

  // `phone` is already null unless the flag is on — the query gates it — but
  // check it here too, so the intent is visible at the point of rendering.
  const phone = settings?.showPhonePublicly ? settings.phone : null

  // The fiscal address is a multi-line text field; flatten it onto one line.
  const address = settings?.address
    ?.split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' · ')

  const fiscalLine = [
    settings?.legalName,
    settings?.nif ? `NIF ${settings.nif}` : null,
    address,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <footer className="border-t border-line bg-paper-alt text-ink">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-12 sm:flex-row sm:justify-between">
          <section>
            <h2 className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
              {t('contactHeading')}
            </h2>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {settings?.email && (
                <li>
                  <a href={`mailto:${settings.email}`} className={LINK_CLASS}>
                    {settings.email}
                  </a>
                </li>
              )}
              {phone && (
                <li>
                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className={LINK_CLASS}
                  >
                    {phone}
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
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
              {t('legalHeading')}
            </h2>
            <nav aria-label={t('legalNav')} className="mt-4">
              <ul className="flex flex-col gap-2 text-sm">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={LINK_CLASS}>
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </section>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-8 text-xs text-ink-muted sm:flex-row sm:items-baseline sm:justify-between">
          <div className="flex flex-col gap-1">
            <p>
              © {year} {settings?.brandName ?? 'Just Be Events'}.{' '}
              {t('rights')}
            </p>
            {fiscalLine && <p>{fiscalLine}</p>}
          </div>

          <p>
            {t('creditPrefix')}{' '}
            <a
              href="https://asaeriksson.com"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              {t('creditName')}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
