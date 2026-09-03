import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/routing'

/**
 * The 404 a visitor actually sees. `proxy.ts` prefixes every unmatched path
 * with a locale, so /nope becomes /es/nope and lands here — inside the
 * [locale] layout, which means header, footer and messages are all present.
 *
 * No `setRequestLocale` call: not-found.tsx receives no `params`, so it relies
 * on the layout above having set the request locale already.
 */
export default async function NotFound() {
  const t = await getTranslations('NotFound')

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-5 px-6 pt-18 text-center">
      <p className="text-sm font-semibold tracking-widest text-jb-700 uppercase">
        404
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {t('title')}
      </h1>
      <p className="text-ink-body text-balance">{t('body')}</p>
      <Link
        href="/"
        className="mt-2 rounded-xs text-sm font-medium text-jb-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700"
      >
        {t('back')}
      </Link>
    </section>
  )
}
