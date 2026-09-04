import type { MetadataRoute } from 'next'

/**
 * TODO — LAUNCH DAY: revisit this file *and* the `robots` block in
 * `src/app/[locale]/layout.tsx`. They are a matched pair; changing one without
 * the other leaves the site either invisible or half-exposed. Verify after the
 * first production deploy by opening https://b-vents.com/robots.txt and
 * confirming it says `Allow: /` — not `Disallow: /`.
 *
 * `VERCEL_ENV` is "production" only for production deployments; it is "preview"
 * on every branch and PR deploy, and undefined when running locally. So the
 * default is the safe one: anything that is not demonstrably production tells
 * crawlers to stay out entirely.
 *
 * This is read at build time, which is what we want — each deployment bakes in
 * the robots.txt appropriate to the environment it was built for.
 */
const isProduction = process.env.VERCEL_ENV === 'production'

export default function robots(): MetadataRoute.Robots {
  if (!isProduction) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The Sanity Studio is a private editing tool, not content.
      disallow: '/studio',
    },
  }
}
