import type { MetadataRoute } from 'next'

/**
 * TODO — LAUNCH DAY, three changes, all at the same time:
 *   1. remove COMING_SOON from Vercel (Production)
 *   2. set NEXT_PUBLIC_SITE_LIVE=true in Vercel (Production)
 *   3. delete `src/app/coming-soon/` and the COMING_SOON branch in
 *      `src/proxy.ts`
 * Then verify on production: https://b-vents.com/robots.txt says `Allow: /`
 * rather than `Disallow: /`, and view-source on the homepage has no `noindex`
 * robots meta tag.
 *
 * Indexing is keyed off NEXT_PUBLIC_SITE_LIVE, not VERCEL_ENV: the production
 * domain is public already but the site is not finished, so "is this a
 * production deploy" is no longer the same question as "may crawlers index
 * this". The flag has to be set deliberately, and anything other than the exact
 * string "true" — unset, preview, local dev — keeps crawlers out entirely.
 *
 * This file and the `robots` block in `src/app/[locale]/layout.tsx` are a
 * matched pair; changing one without the other leaves the site either invisible
 * or half-exposed. Both are read at build time, so each deployment bakes in the
 * rules appropriate to the environment it was built for.
 */
const isLive = process.env.NEXT_PUBLIC_SITE_LIVE === 'true'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

export default function robots(): MetadataRoute.Robots {
  // Both branches advertise the same sitemap and host; only the rules differ.
  const sitemap = new URL('/sitemap.xml', siteUrl).toString()
  const host = new URL(siteUrl).origin

  if (!isLive) {
    return {
      rules: { userAgent: '*', disallow: '/' },
      sitemap,
      host,
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // The Sanity Studio is a private editing tool, not content.
        '/studio',
        // Holding page; DELETE THIS ENTRY WITH THE PAGE.
        '/coming-soon',
      ],
    },
    sitemap,
    host,
  }
}
