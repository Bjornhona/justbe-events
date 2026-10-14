import type { MetadataRoute } from 'next'

/**
 * TODO — LAUNCH DAY, four changes, all at the same time:
 *   1. remove SITE_GATE and PREVIEW_KEY from Vercel (Production)
 *   2. set NEXT_PUBLIC_SITE_LIVE=true in Vercel (Production)
 *   3. delete `src/app/api/preview/` — the bypass only exists to get past the
 *      holding page, and an undocumented cookie-setting route that outlives
 *      its reason is just an opening nobody is watching
 *   4. delete the `coming-soon` case in `src/proxy.ts` and its branch in
 *      `src/app/gate/page.tsx`
 *
 * WHAT STAYS: `maintenance`. `src/app/gate/` and the maintenance case are not
 * launch scaffolding — they are how the site gets closed for ten minutes
 * without a deploy. Keep the `/gate` disallow below with them.
 *
 * Then verify on production: https://b-events.es/robots.txt says `Allow: /`
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
        // The gate page. Stays after launch — maintenance mode still uses it.
        '/gate',
      ],
    },
    sitemap,
    host,
  }
}
