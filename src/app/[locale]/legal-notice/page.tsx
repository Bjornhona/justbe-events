import type { Metadata } from 'next'

import LegalPage, { legalPageMetadata, type LegalSlug } from '@/components/LegalPage'

/**
 * The Sanity slug this route renders. The URL segment is localised by
 * `routing.pathnames`; this is not, because there is one document per policy.
 */
const SLUG: LegalSlug = 'legal-notice'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/legal-notice'>): Promise<Metadata> {
  const { locale } = await params
  return legalPageMetadata(SLUG, locale)
}

export default async function Page({ params }: PageProps<'/[locale]/legal-notice'>) {
  const { locale } = await params
  return <LegalPage slug={SLUG} locale={locale} />
}
