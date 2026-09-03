import { defineQuery } from 'next-sanity'

import type { LocaleString, LocaleText } from './locale'

/**
 * GROQ projections omit any attribute that evaluates to null, so anything the
 * schema does not mark `required` is optional here as well as nullable.
 */
type Maybe<T> = T | null | undefined

// --- shared shapes -------------------------------------------------------

/**
 * An image as it comes out of GROQ: still a reference, because `urlFor()` in
 * `./image` builds the URL from the ref and the hotspot/crop.
 */
export type SanityImage = {
  asset?: Maybe<{ _ref: string; _type: 'reference' }>
  hotspot?: Maybe<{ x: number; y: number; width: number; height: number }>
  crop?: Maybe<{ top: number; bottom: number; left: number; right: number }>
  alt?: Maybe<LocaleString>
}

export type Seo = {
  metaTitle?: Maybe<LocaleString>
  metaDescription?: Maybe<LocaleText>
  ogImage?: Maybe<SanityImage>
}

export type Pillar = 'imagine' | 'build' | 'live'

const IMAGE_FIELDS = /* groq */ `
  asset,
  hotspot,
  crop,
  alt
`

const SEO_FIELDS = /* groq */ `
  metaTitle,
  metaDescription,
  ogImage { ${IMAGE_FIELDS} }
`

/**
 * The three pillars have a meaning-order (imagine → build → live) that is not
 * their alphabetical order, so `order(pillar)` would put "build" first. Rank
 * them explicitly, sort on the rank, then drop it from the payload.
 */
const PILLAR_RANK = /* groq */ `
  select(
    pillar == "imagine" => 0,
    pillar == "build" => 1,
    pillar == "live" => 2,
    3
  )
`

// --- site settings -------------------------------------------------------

export type SiteSettingsQueryResult = {
  _id: string
  brandName?: Maybe<string>
  tagline?: Maybe<LocaleString>
  heroImage?: Maybe<SanityImage>
  /** Resolved CDN URL of the hero video, or null when none is uploaded. */
  heroVideoUrl?: Maybe<string>
  email?: Maybe<string>
  showPhonePublicly?: Maybe<boolean>
  /** Already gated on `showPhonePublicly` — null means do not render a phone. */
  phone?: Maybe<string>
  whatsapp?: Maybe<string>
  legalName?: Maybe<string>
  nif?: Maybe<string>
  address?: Maybe<string>
  defaultSeo?: Maybe<Seo>
} | null

/**
 * The singleton. `_id == "siteSettings"` matches the published document only —
 * the draft lives at `drafts.siteSettings` — so this cannot leak an unpublished
 * fiscal address.
 *
 * `showPhonePublicly` is applied here rather than in the components: the number
 * is Barbara's personal mobile, and gating it once at the query means no future
 * component can render it by forgetting the flag.
 */
export const siteSettingsQuery = defineQuery(`
  *[_id == "siteSettings"][0] {
    _id,
    brandName,
    tagline,
    heroImage { ${IMAGE_FIELDS} },
    "heroVideoUrl": heroVideo.asset->url,
    email,
    showPhonePublicly,
    "phone": select(showPhonePublicly == true => phone),
    whatsapp,
    legalName,
    nif,
    address,
    defaultSeo { ${SEO_FIELDS} }
  }
`)

// --- services ------------------------------------------------------------

export type ServiceListItem = {
  _id: string
  title: LocaleString
  pillar: Pillar
  description?: Maybe<LocaleText>
  order?: Maybe<number>
}

export type ServicesQueryResult = ServiceListItem[]

/** All services, grouped by pillar in narrative order, then by manual order. */
export const servicesQuery = defineQuery(`
  *[_type == "service"] {
    _id,
    title,
    pillar,
    description,
    order,
    "pillarRank": ${PILLAR_RANK}
  } | order(pillarRank asc, coalesce(order, 999) asc) {
    _id,
    title,
    pillar,
    description,
    order
  }
`)

// --- projects ------------------------------------------------------------

export type FeaturedProject = {
  _id: string
  title: LocaleString
  slug?: Maybe<string>
  /** Non-null only when the brand has given written permission. */
  client?: Maybe<string>
  /** Non-null only when the brand has given written permission. */
  clientLogo?: Maybe<SanityImage>
  /** e.g. "una multinacional de alimentación" — always safe to render. */
  anonymousLabel: LocaleString
  eventType: LocaleString
  city?: Maybe<string>
  year?: Maybe<number>
  attendees?: Maybe<number>
  pillar?: Maybe<Pillar>
  heroImage: SanityImage
  /** True while the images are generic stand-ins rather than real photos. */
  isPlaceholder?: Maybe<boolean>
  order?: Maybe<number>
}

export type FeaturedProjectsQueryResult = FeaturedProject[]

/**
 * Featured projects for the home page.
 *
 * The permission model is enforced here, not in the components. `client` and
 * `clientLogo` are only projected when `permissionGranted` is true, so an
 * uncleared brand name never leaves Sanity — it is not in the JSON payload for
 * anyone to read in devtools. Components render `client ?? anonymousLabel`.
 *
 * Projects with no `order` sort last rather than first, so a newly created
 * project cannot silently jump to the top of the home page.
 */
export const featuredProjectsQuery = defineQuery(`
  *[_type == "project" && featured == true] | order(coalesce(order, 999) asc) {
    _id,
    title,
    "slug": slug.current,
    "client": select(permissionGranted == true => client),
    "clientLogo": select(permissionGranted == true => clientLogo { ${IMAGE_FIELDS} }),
    anonymousLabel,
    eventType,
    city,
    year,
    attendees,
    pillar,
    heroImage { ${IMAGE_FIELDS} },
    isPlaceholder,
    order
  }
`)
