import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/routing'

import { HeaderShell } from './header/HeaderShell'
import { LocaleSwitcher } from './header/LocaleSwitcher'
import { MobileMenu } from './header/MobileMenu'
import { SECTIONS } from './header/sections'

/**
 * Server Component. The three client islands underneath it are the scroll
 * state, the mobile menu and the locale switcher — everything else, including
 * every translated label, is rendered here and passed down as children.
 *
 * The wordmark is plain text on purpose; swapping in the logo SVG later is a
 * change to this file only.
 */
export default async function Header() {
  const t = await getTranslations('Nav')

  // `{pathname: '/', hash}` rather than a bare `#servicios`: the header also
  // renders on the legal pages, where those sections do not exist and a bare
  // fragment would be a link that visibly does nothing. This form scrolls when
  // already home, and navigates home first when it isn't.
  const links = SECTIONS.map((section) => ({
    key: section.id,
    href: { pathname: '/', hash: section.id } as const,
    label: t(section.key),
  }))

  return (
    <HeaderShell>
      <Link
        href="/"
        aria-label={t('home')}
        className="rounded-xs text-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
      >
        Just Be Events
      </Link>

      {/* Desktop */}
      <div className="hidden items-center gap-8 md:flex">
        <nav aria-label={t('primary')}>
          <ul className="flex items-center gap-8 text-sm font-medium">
            {links.map((link) => (
              <li key={link.key}>
                <Link
                  href={link.href}
                  className="rounded-xs transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <LocaleSwitcher />
      </div>

      {/* Mobile. The same links again, rendered on the server and handed to the
          overlay as children. The two navs carry different aria-labels so
          assistive tech does not announce two identical landmarks. */}
      <MobileMenu>
        <nav aria-label={t('mobile')}>
          <ul className="flex flex-col gap-6">
            {links.map((link) => (
              <li key={link.key}>
                <Link
                  href={link.href}
                  className="rounded-xs text-3xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-jb-700"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <LocaleSwitcher />
      </MobileMenu>
    </HeaderShell>
  )
}
