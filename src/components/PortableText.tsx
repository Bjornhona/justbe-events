import {
  PortableText as PortableTextRenderer,
  type PortableTextBlock,
  type PortableTextComponents,
} from '@portabletext/react'
import Image from 'next/image'

import { imageSource, urlFor } from '@/sanity/lib/image'
import { pickLocale, type Locale } from '@/sanity/lib/locale'
import type { SanityImage } from '@/sanity/lib/queries'

/**
 * Renders the `localeBlock` rich text used by legal pages and blog posts.
 *
 * Server Component. `@portabletext/react` v8 ships a `react-server` entry and
 * carries no `'use client'`, so none of this reaches the browser — a legal page
 * stays entirely static HTML.
 *
 * ── WHY THE STYLING LIVES HERE AND NOT IN A PROSE PLUGIN ───────────────────
 * Every class below is built from the design tokens in `globals.css`, so the
 * body copy on a legal page is the same ink and the same measure as the body
 * copy on the home page. A generic typography plugin would introduce a second,
 * competing set of type and colour decisions that drift from the tokens the
 * rest of the site is built on.
 *
 * ── WHAT AN EDITOR CAN ACTUALLY PRODUCE ────────────────────────────────────
 * `localeBlock` allows exactly four styles (normal, h2, h3, blockquote), one
 * list type (bullet), two decorators (strong, em) and images. Every one of
 * those has a component here. An unhandled type is not a silent no-op in v8 —
 * it warns and renders nothing — so this list must stay in step with the
 * schema. If you add a style there, add it here in the same commit.
 *
 * H1 is deliberately absent: the page shell owns the document's single <h1>
 * (the legal page's `title`), so body content starts at h2.
 */

// --- custom block types ---------------------------------------------------

/**
 * One row of the data-processor table.
 *
 * Plain strings rather than `localeString`, because this object sits *inside*
 * a per-language array — by the time we are here, `body.es` has already chosen
 * the language, and a nested locale object would ask the editor to pick again.
 */
export type ProcessorRow = {
  _key?: string
  provider?: string | null
  purpose?: string | null
}

/**
 * The processor list, rendered as a definition list.
 *
 * PORTABLE TEXT HAS NO TABLE TYPE, and the source documents
 * (`content/legal-*.md`) hold this content as a two-column markdown table of
 * providers and what each is used for. A `<dl>` is the honest HTML for that
 * shape: the pairing is name → description, which is what a definition list
 * means, and unlike a `<table>` it degrades to a readable stack on a phone
 * without needing a horizontal scroller.
 *
 * The alternative — flattening it to "Vercel Inc.: hosting" bullet points —
 * would lose the association between the two halves for a screen reader.
 */
export type ProcessorListValue = {
  _type: 'processorList'
  _key?: string
  rows?: ProcessorRow[] | null
}

/** An inline image, as `localeBlock` defines it. */
export type BlockImageValue = SanityImage & {
  _type: 'image'
  _key?: string
}

// --- link handling --------------------------------------------------------

export type LinkMarkValue = {
  _type: 'link'
  href?: string | null
}

/**
 * Anything that leaves the site opens in a new tab with `rel="noopener
 * noreferrer"`. `mailto:` and `tel:` are not "external" in that sense — they
 * hand off to a mail client or dialler, and a `target="_blank"` there leaves an
 * orphaned blank tab behind.
 *
 * Site-relative links (`/es/privacidad`, `#seccion`) stay plain anchors rather
 * than the typed `Link` from `@/i18n/routing`: that helper's `href` is a union
 * of the paths declared in `routing.pathnames`, and an editor in the Studio can
 * type any string at all. A full page load on a cross-reference between two
 * legal pages is a fair price for not having to cast.
 */
function linkKind(href: string): 'external' | 'internal' | 'handoff' {
  if (/^(mailto:|tel:)/i.test(href)) return 'handoff'
  if (/^(https?:)?\/\//i.test(href)) return 'external'
  return 'internal'
}

const LINK_CLASS =
  'text-jb-700 rounded-xs underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700'

// --- components -----------------------------------------------------------

/**
 * Built per render rather than declared once at module scope, because the image
 * `alt` is a `localeString` and needs the active locale to resolve. Everything
 * else is static; only `types.image` closes over the argument.
 */
function buildComponents(locale: Locale): PortableTextComponents {
  return {
    block: {
      // `first:mt-0` so a body that opens on a heading does not push itself
      // away from the page title above it.
      h2: ({ children }) => (
        <h2 className="font-display text-h2 text-ink mt-16 mb-4 max-w-[24ch] font-light text-balance first:mt-0">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="font-display text-h3 text-ink mt-10 mb-3 font-medium first:mt-0">
          {children}
        </h3>
      ),
      normal: ({ children }) => (
        <p className="text-body text-ink-muted mt-4 max-w-prose leading-relaxed">
          {children}
        </p>
      ),
      blockquote: ({ children }) => (
        <blockquote className="border-jb-500 text-body text-ink-body my-8 max-w-prose border-l-2 pl-6 leading-relaxed">
          {children}
        </blockquote>
      ),
    },

    list: {
      bullet: ({ children }) => (
        <ul className="text-body text-ink-muted mt-4 max-w-prose list-disc space-y-2 pl-6 leading-relaxed">
          {children}
        </ul>
      ),
    },

    listItem: {
      bullet: ({ children }) => <li className="pl-1">{children}</li>,
    },

    marks: {
      strong: ({ children }) => (
        <strong className="text-ink font-semibold">{children}</strong>
      ),
      em: ({ children }) => <em className="italic">{children}</em>,
      link: ({ value, children }) => {
        const href = typeof value?.href === 'string' ? value.href.trim() : ''

        // A link annotation with no href is a half-finished edit. Render the
        // text, not an <a> that goes nowhere.
        if (href === '') return <>{children}</>

        const kind = linkKind(href)

        return (
          <a
            href={href}
            className={LINK_CLASS}
            {...(kind === 'external'
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
          >
            {children}
          </a>
        )
      },
    },

    types: {
      processorList: ({ value }: { value: ProcessorListValue }) => {
        const rows = (value.rows ?? []).filter(
          (row) => row.provider || row.purpose,
        )
        if (rows.length === 0) return null

        return (
          <dl className="divide-line border-line mt-6 max-w-prose divide-y border-t border-b">
            {rows.map((row, index) => (
              // A <div> grouping each <dt>/<dd> pair is valid inside <dl> and
              // is what lets the pair sit on one grid row.
              <div
                key={row._key ?? index}
                className="grid gap-1 py-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6"
              >
                <dt className="text-body text-ink font-medium">
                  {row.provider}
                </dt>
                <dd className="text-body text-ink-muted leading-relaxed">
                  {row.purpose}
                </dd>
              </div>
            ))}
          </dl>
        )
      },

      image: ({ value }: { value: BlockImageValue }) => {
        const source = imageSource(value)
        if (!source) return null

        // Empty alt rather than a missing one: an undescribed decorative image
        // should be skipped by a screen reader, not read out as its filename.
        const alt = pickLocale(value.alt, locale)

        return (
          <figure className="mt-8 max-w-prose">
            <Image
              src={urlFor(source).width(1400).fit('max').auto('format').url()}
              alt={alt}
              width={1400}
              height={933}
              sizes="(min-width: 768px) 65ch, 100vw"
              className="h-auto w-full rounded-sm"
            />
            {alt !== '' && (
              <figcaption className="text-small text-ink-muted mt-2">
                {alt}
              </figcaption>
            )}
          </figure>
        )
      },
    },
  }
}

export default function PortableText({
  value,
  locale,
}: {
  value: PortableTextBlock[]
  locale: Locale
}) {
  if (value.length === 0) return null

  return (
    <PortableTextRenderer value={value} components={buildComponents(locale)} />
  )
}
