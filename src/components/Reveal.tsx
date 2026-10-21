'use client'

import { motion, useReducedMotion, type Variants } from 'motion/react'
import { Children, isValidElement, type ElementType, type ReactNode } from 'react'

/**
 * The only motion on the site. Content fades in and rises as it enters the
 * viewport, once — no hover animations, parallax or scroll-linked effects.
 *
 * `whileInView` replaces the hand-rolled IntersectionObserver this used to run.
 * `viewport.margin` is the same -10% that held the reveal until the element was
 * a little way in, rather than triggering on the single pixel that clips the
 * viewport edge.
 *
 * ── TWO MODES ─────────────────────────────────────────────────────────────
 * Default: the whole subtree animates as one element. Right for a section that
 * is a single unit of content — a paragraph, a quote.
 *
 * `stagger`: each DIRECT CHILD animates in sequence, 90ms apart. A section
 * made of repeated items (three columns, four cards) reads as dead when the
 * whole block slides as one rectangle; the offset between items is what makes
 * the movement legible.
 *
 * In stagger mode each child is re-created as its own motion equivalent —
 * `<article>` becomes `motion.article`, same tag, same props, same position.
 * It is NOT wrapped in an extra element, and that matters: these children are
 * usually grid items carrying their own track placement (`md:col-span-7` on
 * Work's cards). A wrapper would become the grid item instead and the
 * placement would apply to the wrong box. So the caller puts the grid on
 * Reveal itself via `className`, and the items stay Reveal's direct children.
 *
 * ── REDUCED MOTION ────────────────────────────────────────────────────────
 * `useReducedMotion()` short-circuits the animation, but note HOW. The
 * obvious spelling — varying `initial` by the hook — is wrong, and measurably
 * so:
 *
 *   The server cannot read a media query, so it always renders the un-reduced
 *   branch and emits `opacity: 0` inline. A reduced-motion client that then
 *   renders a different initial state disagrees with that markup. React
 *   reports "some attributes of the server rendered HTML didn't match... This
 *   won't be patched up" — and it means it. The inline `opacity: 0` stays on
 *   the element, Motion never touches it again, and every section is invisible
 *   forever. Verified by deleting the CSS rule below: all seven went to 0.
 *
 * So the `hidden` variant is identical in both branches, which keeps server
 * and client in agreement and keeps hydration clean. Only the transition
 * differs — reduced motion lands on `shown` with `duration: 0` and no stagger,
 * via `animate` rather than `whileInView` so it does not wait for a scroll
 * that may never come.
 *
 * The CSS in `globals.css` is still not redundant. It covers the window
 * before hydration, where no JS has run and the markup is still `opacity: 0`;
 * and it re-evaluates when the OS setting is flipped with the tab open, which
 * this hook does not — it is `useState(current)` with no subscription.
 */

/** The published easing. A tuple, not `as const` — Motion wants it mutable. */
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]
const DISTANCE = 32
const DURATION = 0.7
const STAGGER = 0.09

/** `hidden` is byte-identical across both branches. See the note above. */
const item = (instant: boolean): Variants => ({
  hidden: { opacity: 0, y: DISTANCE },
  shown: {
    opacity: 1,
    y: 0,
    transition: instant ? { duration: 0 } : { duration: DURATION, ease: EASE },
  },
})

const container = (instant: boolean, delay: number): Variants => ({
  hidden: {},
  shown: {
    transition: {
      staggerChildren: instant ? 0 : STAGGER,
      delayChildren: instant ? 0 : delay,
    },
  },
})

/**
 * Re-creates each direct child as its motion counterpart so it can carry
 * variants. Anything that is not an intrinsic element — a string, a component
 * — is passed through untouched rather than silently dropped.
 */
function asMotionChildren(children: ReactNode, variants: Variants) {
  return Children.map(children, (child) => {
    if (!isValidElement(child) || typeof child.type !== 'string') return child
    const Tag = (motion as unknown as Record<string, ElementType | undefined>)[
      child.type
    ]
    if (!Tag) return child
    return <Tag {...(child.props as object)} variants={variants} />
  })
}

export default function Reveal({
  children,
  className,
  delay = 0,
  stagger = false,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  /** Seconds, before the first child moves. */
  delay?: number
  /** Animate direct children in sequence instead of the block as one. */
  stagger?: boolean
  /** The container's tag. `dl` is for Numbers, whose grid is a description list. */
  as?: 'div' | 'dl'
}) {
  const shouldReduceMotion = useReducedMotion() ?? false
  const Container = motion[as]

  // Reduced motion lands on the resting state on mount: `animate`, not
  // `whileInView`, and no transition.
  const trigger = shouldReduceMotion
    ? { animate: 'shown' as const }
    : {
        whileInView: 'shown' as const,
        viewport: { once: true, margin: '-10% 0px' },
      }

  return (
    <>
      {/* With JS off nothing ever animates in, so the elements would keep the
          inline `opacity: 0` Motion server-rendered and the section would be
          blank. This puts it back.

          A SIBLING of the container, not a child. The container is now
          sometimes a <dl> — whose content model allows only dt/dd/div — and
          sometimes a grid, where a stray child is a stray cell. The style
          selector is global, so it works from anywhere in the document.

          `dangerouslySetInnerHTML` rather than JSX children: a browser with
          scripting *enabled* parses <noscript> contents as raw text, so React
          would find a text node where it expected a <style> element and report
          a hydration mismatch. Setting the HTML directly opts the subtree out
          of hydration entirely.

          Both `translate` and `transform` are reset: Motion writes `transform`,
          Tailwind v4 animates `translate`, and this file has been through
          both. */}
      <noscript
        data-reveal-fallback=""
        dangerouslySetInnerHTML={{
          __html:
            '<style>[data-reveal],[data-reveal] > *{opacity:1!important;translate:none!important;transform:none!important}noscript[data-reveal-fallback]{display:none}</style>',
        }}
      />

      {stagger ? (
        <Container
          data-reveal=""
          className={className}
          initial="hidden"
          variants={container(shouldReduceMotion, delay)}
          {...trigger}
        >
          {asMotionChildren(children, item(shouldReduceMotion))}
        </Container>
      ) : (
        <Container
          data-reveal=""
          className={className}
          initial="hidden"
          variants={item(shouldReduceMotion)}
          transition={shouldReduceMotion ? undefined : { delay }}
          {...trigger}
        >
          {children}
        </Container>
      )}
    </>
  )
}
