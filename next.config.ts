import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    // Sanity serves every asset from one host, so the pathname is what makes
    // this specific: scoped to this project and dataset, nobody else's images
    // can be run through our optimizer. The id is already public — it is in
    // NEXT_PUBLIC_SANITY_PROJECT_ID and in every image URL on the page.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: `/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/**`,
      },
    ],
  },
};

export default withNextIntl(nextConfig);
