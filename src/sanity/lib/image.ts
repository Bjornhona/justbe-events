import {
  createImageUrlBuilder,
  type SanityImageObject,
  type SanityImageSource,
} from '@sanity/image-url'

import { dataset, projectId } from '../env'
import type { SanityImage } from './queries'

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({ projectId, dataset })

export const urlFor = (source: SanityImageSource) => {
  return builder.image(source)
}

/**
 * Narrows an image as GROQ returns it into something `urlFor` will take, or
 * null when there is no upload behind the field.
 *
 * Two mismatches to reconcile, and one place to do it rather than in every
 * component: an image field that has never been filled comes back with no
 * `asset`, and GROQ returns `null` for an unset hotspot or crop where the URL
 * builder's types want them simply absent.
 *
 * Callers should treat null as "render no image", not as "render a broken one".
 */
export function imageSource(
  image: SanityImage | null | undefined,
): SanityImageObject | null {
  if (!image?.asset?._ref) return null

  return {
    asset: image.asset,
    hotspot: image.hotspot ?? undefined,
    crop: image.crop ?? undefined,
  }
}
