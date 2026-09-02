import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // The CDN is a cache: fast and cheap, but it can serve content a few seconds
  // stale. That is the right trade in production. In development we want to see
  // an edit in the Studio on the next refresh, so we go straight to the API.
  useCdn: process.env.NODE_ENV === 'production',
  // Never leak drafts to the public site. `live.ts` overrides this per-request
  // when it needs the draft perspective for preview.
  perspective: 'published',
})
