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
 *
 * ── WRITING CONTENT FOR tone="dark" ───────────────────────────────────────
 * This component sets the background and nothing else. It does NOT invert the
 * text colours for you, because it cannot know which element is a figure, a
 * label or a link — so a section that switches to `dark` and changes nothing
 * else renders near-black type on a near-black ground. Two rules, both
 * measured against `--color-ink-deep` (#1a1715):
 *
 *   TEXT     `text-paper` (16.83:1), dimmed with an opacity modifier for
 *            secondary copy. `text-paper/70` is 8.65:1 and still clears AA;
 *            even /50 clears it at 5.05:1, so dim freely.
 *            `text-ink` and `text-ink-muted` are unusable here.
 *
 *   ACCENTS  `text-jb-400` (8.15:1), NOT the `text-jb-700` used everywhere
 *            else. This is the exact inverse of the rule on paper: jb-700 is
 *            the AA-safe link colour on a light ground and measures just
 *            3.18:1 here, which fails AA for anything under 24px. jb-500 is
 *            also fine at 7.00:1 if a softer accent is wanted.
 *
 * There is no accent in a dark section today; this is written down so the
 * first one that needs a link does not have to re-derive it.
 */
const TONE_BG = {
  paper: 'bg-paper',
  alt: 'bg-paper-alt',
  dark: 'bg-ink-deep',
} as const

export default function Section({
  id,
  tone = 'paper',
  padding = 'standard',
  className,
  children,
}: {
  id: string
  tone?: keyof typeof TONE_BG
  /** `tall` is 1.5x the standard rhythm — the hero uses the same multiple. */
  padding?: 'standard' | 'tall'
  className?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className={[TONE_BG[tone], className].filter(Boolean).join(' ')}
    >
      {/* The page's vertical rhythm, set once. The empty space is the effect,
          not a side-effect of something else growing — if a section looks too
          airy, that is the intent and nothing should be enlarged to fill it.

          Both values are written out rather than computed, because Tailwind
          scans source text for class names: a template literal that built the
          clamp from a multiplier would produce no CSS at all. */}
      <div
        className={[
          'mx-auto max-w-6xl px-4 sm:px-6',
          padding === 'tall'
            ? 'py-[clamp(10.5rem,27vh,21rem)]'
            : 'py-[clamp(7rem,18vh,14rem)]',
        ].join(' ')}
      >
        {children}
      </div>
    </section>
  )
}
