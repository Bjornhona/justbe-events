'use client'

import { useLocale, useTranslations } from 'next-intl'

import { Link, usePathname, routing } from '@/i18n/routing'

const LOCALE_LABELS: Record<string, string> = {
  es: 'ES',
  en: 'EN',
}

/**
 * Client only because of `usePathname`.
 *
 * `usePathname` from `@/i18n/routing` returns the *internal* pathname — it
 * gives `/legal-notice` whether the browser is showing `/es/aviso-legal` or
 * `/en/legal-notice`. Feeding that straight back into `<Link locale={…}>` is
 * what makes the switcher land on the translated equivalent of the current page
 * rather than dumping the visitor on the home page.
 */
export function LocaleSwitcher() {
  const pathname = usePathname()
  const active = useLocale()
  const t = useTranslations('Nav')

  return (
    <div
      role="group"
      aria-label={t('language')}
      className="flex items-center gap-1 text-sm font-medium"
    >
      {routing.locales.map((locale, index) => {
        const label = LOCALE_LABELS[locale] ?? locale.toUpperCase()

        return (
          <span key={locale} className="flex items-center gap-1">
            {index > 0 && (
              <span aria-hidden="true" className="opacity-40">
                /
              </span>
            )}
            {locale === active ? (
              // The current language is not a link. Marking it up as one that
              // goes nowhere is the classic screen-reader trap.
              <span aria-current="true" lang={locale} className="opacity-100">
                {label}
              </span>
            ) : (
              <Link
                href={pathname}
                locale={locale}
                lang={locale}
                hrefLang={locale}
                className="rounded-xs opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
              >
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </div>
  )
}
