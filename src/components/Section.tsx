import type { ReactNode } from 'react'

/**
 * Server Component. The wrapper every landing-page section uses, so the rhythm
 * of the page is set in one file rather than re-typed per section.
 *
 * Two elements on purpose: the <section> carries the background so it runs
 * full-bleed edge to edge, and the inner <div> holds the content to a readable
 * measure. Alternating `tone` is what separates one section from the next —
 * there are no rules or borders between them.
 *
 * `max-w-6xl` is 72rem in Tailwind v4 and matches the header's inner container,
 * so section content lines up with the wordmark and nav above it.
 *
 * Scroll offset for anchor links is NOT set here. globals.css already does it
 * for every `section[id]` as `calc(var(--header-h) + 1.5rem)`, which tracks the
 * header height instead of hard-coding it. That rule is unlayered, so it beats
 * any `scroll-mt-*` utility we could put on this element.
 */
export default function Section({
  id,
  tone = 'paper',
  className,
  children,
}: {
  id: string
  tone?: 'paper' | 'alt'
  className?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className={[tone === 'alt' ? 'bg-paper-alt' : 'bg-paper', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mx-auto max-w-6xl px-4 py-[clamp(5rem,12vh,9rem)] sm:px-6">
        {children}
      </div>
    </section>
  )
}
