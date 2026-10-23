'use client'

import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { DURATION, EASE, RevealFallback } from '@/components/Reveal'
import { measureLines, toSegments, type Line } from '@/lib/lines'

/**
 * The hero's text stack, and the one piece of bespoke motion on the site.
 *
 * `Reveal` fades a block in as a single element, which is right everywhere
 * else and wrong here: the headline is the page, and four lines arriving one
 * after another is the difference between a page that opens and a page that
 * appears. So this component owns the sequence, and `Reveal` is left generic.
 *
 * ── THE SEQUENCE ──────────────────────────────────────────────────────────
 *   t=0      eyebrow fades
 *   t=0.2    line 1 rises out of its mask, then one line every 80ms
 *   t=last   lead and CTA fade, once the final line has landed
 *
 * Lines only — no word or character effect. At 120px a per-character stagger
 * reads as a cheap text-animation preset, and splitting a Spanish string into
 * characters breaks the diacritics in "cuándo"/"dónde"/"quién" the moment the
 * source is not NFC-normalised. `lib/lines.ts` splits on whitespace for the
 * same reason.
 *
 * ── WHY THIS IS A CLIENT COMPONENT THAT OWNS ITS MARKUP ───────────────────
 * The line count is a layout result, so it is only knowable in the browser —
 * and the lead and the CTA cannot be timed without it. Their delay is derived
 * from the measured number of lines, which means one component has to hold all
 * four blocks. `Hero` keeps the copy, the link and the section; the classes
 * that belong to the animated stack live here.
 *
 * Nothing extra is shipped by this: the whole stack already crossed a client
 * boundary, because `Reveal` wrapped it.
 *
 * ── SSR, AND WHY THERE IS NO FLASH ────────────────────────────────────────
 * The server renders the real headline: one <h1>, the full string, the accent
 * span where the translator put it, final size and measure. No per-word
 * wrappers, nothing for a crawler or a screen reader to reassemble.
 *
 * It is server-rendered at `opacity: 0`, which is the same deal every section
 * on this site already makes — the alternative is worse. Markup paints the
 * moment it streams, long before hydration, so text that is visible in the SSR
 * HTML and then split and pushed down to `y: 110%` would visibly blink out.
 * Hidden-then-revealed is the only order that has no flash in it. The two
 * escape hatches `Reveal` documents cover the cases where the reveal never
 * runs: `RevealFallback` for no JS, and the `prefers-reduced-motion` rule in
 * `globals.css` for a preference flipped mid-session.
 *
 * The swap from one <h1> of text to per-line masks happens while the heading is
 * still at `opacity: 0`, and is measured to land in exactly the same place —
 * see the mask classes below. The heading's own fade is `duration: 0` for the
 * same reason: it has nothing to fade, the masks are still holding every line.
 *
 * ── THE FONT COMES FIRST ──────────────────────────────────────────────────
 * Nothing is measured until Clash Display itself has settled: breaks taken in
 * the metric-adjusted fallback are not the same breaks, and once frozen into a
 * mask they are wrong for good. See `faceSettled` and `FONT_TIMEOUT`, which
 * together guarantee that the only breaks this component freezes are ones it
 * measured in the face the heading is actually read in.
 *
 * ── REDUCED MOTION ────────────────────────────────────────────────────────
 * Not splitting at all: the heading renders as the plain <h1> it was
 * server-rendered as, and the stack lands on its resting state on mount with
 * `duration: 0`. As in `Reveal`, the `hidden` variants are byte-identical
 * across both branches — varying `initial` by the hook is a hydration mismatch
 * that React refuses to patch up, and leaves the hero invisible forever. That
 * bug is documented at length in `Reveal`; it applies here unchanged.
 */

/** 80ms between lines. Enough to read as a sequence, not as a delay. */
const LINE_STAGGER = 0.08

/** The eyebrow's head start on the first line. */
const HEAD_START = 0.2

/**
 * How long to wait for Clash Display before giving up on the split entirely.
 *
 * The measurement has to happen in the face the heading will be read in.
 * `next/font` preloads the woff2 and `adjustFontFallback` keeps the fallback
 * metrically close, but close is not the same, and `display: swap` means the
 * fallback is what is on screen until the file lands. Measured: with a cold
 * cache and the woff2 held back, the tagline rags to FIVE lines in adjusted
 * Arial and four in Clash. Split early and the reveal plays on breaks that are
 * wrong, then snaps when the real face arrives.
 *
 * So this is not a "measure with whatever we have" timeout. If the face has not
 * settled by now, the heading is revealed WITHOUT being split — one fade, no
 * masks, no frozen breaks — and it stays that way. The only line breaks this
 * component ever freezes are ones it measured in the real face.
 *
 * 2.5s because the thing it is really guarding against is a woff2 that never
 * arrives at all. The file is 29KB and preloaded, so on any working connection
 * it wins this race long before hydration; a hero that waits is better than a
 * hero that lies, and a hero that fades in whole is better than one that never
 * appears.
 */
const FONT_TIMEOUT = 2500

const EYEBROW_CLASS =
  'text-small text-ink-muted mb-[clamp(1.5rem,4vh,2.5rem)] text-center font-sans tracking-[0.18em] uppercase md:text-left'

/** Kept in a constant because the probe in `lib/lines.ts` is measured with it. */
const HEADLINE_CLASS =
  'font-display text-hero text-ink text-center font-light text-balance md:text-left'

const LEAD_CLASS =
  'text-body text-ink-muted mx-auto mt-8 max-w-[46ch] text-center md:mx-0 md:text-left'

/**
 * The mask. `overflow-hidden` is the whole effect — the line is clipped to its
 * own box and rises into it.
 *
 * `leading-[1.2]` with the negative margin is not a style choice, it is what
 * keeps the clip off the glyphs. Clash Display's content box is 1.14em — ascent
 * 0.89 plus descent 0.25, measured off the woff2 — and `--text-hero` sets a line
 * height of 1.02, tighter than the font's own ink, so the ink hangs 0.06em out
 * of the line box at each end. The Spanish copy survives that by a hair:
 * "quién y por qué" inks down to 1.00em of a 1.02em box, 2.4px of clearance at
 * the hero's 120px. An accented capital does not — "Á" inks to 0.851em of
 * ascent, 0.02em above the same box — and one word of new copy is all it would
 * take. So the mask does not depend on the margin being there.
 *
 * Each line gets a 1.2em box instead, which contains the whole content box, and
 * 0.09em comes back off the top and the bottom ((1.2 - 1.02) / 2) so the line
 * still occupies exactly 1.02em. Measured against the unsplit heading: total
 * height within 0.07px and every baseline within 0.25px at 1440, which is
 * LayoutUnit rounding rather than slack in the arithmetic.
 *
 * The same trick horizontally, with 0.06em: a stretched flex item's content
 * width is unchanged by padding plus matching negative margin, so the measured
 * line still fits, and the clip edge moves outside the side bearings — which
 * `--text-hero`'s -0.03em tracking pulls in tight at the end of a full line.
 *
 * The taller box costs the hidden state nothing, because `y: 110%` is a
 * percentage of the line's own box and grows with it: a hidden line sits
 * 1.32em down with its ink starting 0.07em below that, well clear of a clip
 * edge at 1.2em.
 */
const MASK_CLASS =
  'block overflow-hidden leading-[1.2] my-[-0.09em] px-[0.06em] mx-[-0.06em]'

/** The eyebrow, the lead and the CTA. A fade, with no rise under it — the
 *  lines are the movement, and a second direction competes with them. */
const fade = (instant: boolean, delay: number): Variants => ({
  hidden: { opacity: 0 },
  shown: {
    opacity: 1,
    transition: instant ? { duration: 0 } : { duration: DURATION, ease: EASE, delay },
  },
})

/**
 * One line. Transform only: the mask does the hiding, so a line never animates
 * its opacity.
 *
 * The delay is baked into the variant per line rather than read from `custom`
 * with a dynamic variant. That spelling looks tidier and does not work here:
 * with the lines a level below the heading (h1 > mask > line), `custom` did not
 * reach the resolver, and Chrome's animation list showed one line animating
 * with no delay at all instead of four at 200/280/360/440ms. Verified both ways
 * through the Animation domain.
 */
const line = (instant: boolean, index: number): Variants => ({
  hidden: { y: '110%' },
  shown: {
    y: 0,
    transition: instant
      ? { duration: 0 }
      : { duration: DURATION, ease: EASE, delay: HEAD_START + index * LINE_STAGGER },
  },
})

/** When the lead and the CTA may start: as the last line finishes. */
const tailDelay = (lineCount: number) =>
  HEAD_START + Math.max(0, lineCount - 1) * LINE_STAGGER + DURATION

/**
 * Is the heading, right now, being drawn in a webfont that has actually
 * loaded? Two conditions, and both are load-bearing.
 *
 * NOT `document.fonts.ready`, which is what this used to await. `ready` means
 * "no font loads are pending", and that is trivially true before the stylesheet
 * has been parsed and the woff2 requested. Measured on one cold load:
 * `fonts.status` reads `loaded` at t=319ms and `loading` at t=859ms.
 *
 * NOT `fonts.check()` on its own either. In that same pre-stylesheet window the
 * heading computes to the UA default — measured: `font-family: Times` at
 * t=854ms on a throttled load — and `check()` says yes to Times, because a
 * system font genuinely is available. Hence the first condition: the family has
 * to be one of the faces this document declares. A face Next generated is
 * declared; Times is not.
 *
 * Consequence worth knowing: if `--font-display` is ever pointed at a system
 * stack, this never becomes true and the heading reveals whole instead of line
 * by line. That is the safe direction to fail, but it is the line to change.
 */
function headlineFaceLoaded(headline: HTMLElement) {
  const fonts = document.fonts
  if (!fonts) return false

  const { family, shorthand } = headlineFont(headline)

  let declared = false
  fonts.forEach((face) => {
    if (face.family === family) declared = true
  })
  if (!declared) return false

  try {
    return fonts.check(shorthand)
  } catch {
    return false
  }
}

/**
 * The heading's first font family, in the two shapes the Font Loading API
 * wants it: quoted as the computed value had it, for the `check()`/`load()`
 * shorthand — one of these faces is named "clashDisplay Fallback" and a family
 * with a space in it has to stay quoted — and bare, for comparing against
 * `FontFace.family`, which is never quoted.
 */
function headlineFont(headline: HTMLElement) {
  const style = getComputedStyle(headline)
  const first = style.fontFamily.split(',')[0].trim()

  return {
    family: first.replace(/^["']|["']$/g, ''),
    shorthand: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${first}`,
  }
}

/**
 * Resolves when the heading's face is loaded. Never resolves if it never loads
 * — FONT_TIMEOUT is what bounds the wait, and reveals the heading whole.
 *
 * `fonts.load()` is in here to start the face if nothing else has, for the same
 * reason `status` cannot be trusted; `loadingdone` and `ready` are both watched
 * because either can be the one that fires for the face we care about.
 */
function whenHeadlineFaceLoaded(headline: HTMLElement, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const fonts = document.fonts
    if (!fonts) return resolve()

    const check = () => {
      if (signal.aborted || !headlineFaceLoaded(headline)) return
      resolve()
    }

    if (headlineFaceLoaded(headline)) return resolve()

    fonts.addEventListener('loadingdone', check, { signal })
    fonts.ready.then(check)

    try {
      fonts.load(headlineFont(headline).shorthand).then(check, check)
    } catch {
      // An unparseable shorthand just means we wait on the events instead.
    }
  })
}

type Split =
  /** Before the measurement: the heading as the server rendered it. */
  | { kind: 'pending' }
  /** Measured. `instant` re-renders lines at rest, for a re-split after the reveal. */
  | { kind: 'lines'; lines: Line[]; instant: boolean }
  /**
   * Revealed without being split: a measurement we could not trust, or a face
   * that had not settled in time. The heading fades in as one block, and keeps
   * the browser's own live line breaks rather than any frozen ones.
   */
  | { kind: 'whole' }

export default function HeroText({
  eyebrow,
  tagline,
  lead,
  cta,
}: {
  eyebrow: ReactNode
  /** Rich text: `t.rich('tagline', …)`, accent span included. */
  tagline: ReactNode
  lead: ReactNode
  /** The CTA link itself. The <p> around it belongs to the stack, so it is here. */
  cta: ReactNode
}) {
  const shouldReduceMotion = useReducedMotion() ?? false
  const [split, setSplit] = useState<Split>({ kind: 'pending' })
  const headlineRef = useRef<HTMLHeadingElement>(null)

  const segments = useMemo(() => toSegments(tagline), [tagline])

  useEffect(() => {
    // Rich text this cannot take apart (`segments` null) is not a state to
    // record: there is nothing to measure and nothing to wait for, and `ready`
    // below reads it straight off the props.
    if (shouldReduceMotion || !segments) return

    let cancelled = false
    // The width the current lines were measured at, and whether the reveal has
    // already run. Locals, not state: nothing renders off them, and the effect
    // runs once, so the closure is the right scope.
    let measuredWidth = 0
    let played = false

    const remeasure = () => {
      const headline = headlineRef.current
      const parent = headline?.parentElement
      if (cancelled || !headline || !parent) return

      const width = headline.getBoundingClientRect().width
      if (width === 0) return
      measuredWidth = width

      const lines = measureLines({
        parent,
        width,
        className: HEADLINE_CLASS,
        tag: 'h1',
        segments,
      })

      if (cancelled) return
      if (!lines) {
        setSplit({ kind: 'whole' })
        return
      }

      setSplit({ kind: 'lines', lines, instant: played })
      played = true
    }

    // Measure in the real face, or do not measure at all. See FONT_TIMEOUT.
    let decided = false
    const abort = new AbortController()

    const fontTimer = setTimeout(() => {
      if (decided || cancelled) return
      decided = true
      abort.abort()
      setSplit({ kind: 'whole' })
    }, FONT_TIMEOUT)

    const headline = headlineRef.current
    if (headline) {
      whenHeadlineFaceLoaded(headline, abort.signal).then(() => {
        clearTimeout(fontTimer)
        if (decided || cancelled) return
        decided = true
        remeasure()
      })
    }

    // Frozen lines go stale when the measure changes — a rotated phone, a
    // dragged window — and a line wider than its mask is a clipped line, so
    // they are measured again. The heading's own box changes height when it is
    // split, which would feed back into the observer, so this watches the
    // parent: same width, and it does not move.
    //
    // A re-split lands at rest (`instant`), because by then the reveal has
    // played. Resizing *during* the reveal therefore cuts it short — a window
    // being dragged in the first second of a page load, which is a trade worth
    // making for not animating the headline a second time.
    const observer = new ResizeObserver(() => {
      // Zero means no measurement has been taken: either none yet, or the face
      // never settled and the heading was revealed whole. In the second case
      // this must stay zero for good — splitting a heading that is already on
      // screen would snap it into masks in front of the reader.
      if (measuredWidth === 0) return
      const width = headlineRef.current?.getBoundingClientRect().width ?? 0
      if (Math.abs(width - measuredWidth) < 0.5) return
      remeasure()
    })
    const parent = headlineRef.current?.parentElement
    if (parent) observer.observe(parent)

    return () => {
      cancelled = true
      clearTimeout(fontTimer)
      // Drops the `loadingdone` listener: the face may never load, and the
      // promise waiting on it would otherwise keep this closure alive.
      abort.abort()
      observer.disconnect()
    }
  }, [segments, shouldReduceMotion])

  // Nothing moves until the lines are known, or until we know there will not be
  // any: the eyebrow's 200ms head start is a head start on the first line, so
  // the whole sequence starts together. Under reduced motion, and on rich text
  // that cannot be split, there is nothing to wait for.
  const ready = shouldReduceMotion || !segments || split.kind !== 'pending'
  const lineCount = split.kind === 'lines' ? split.lines.length : 1

  return (
    <>
      <RevealFallback />

      <motion.div data-reveal="" initial="hidden" animate={ready ? 'shown' : 'hidden'}>
        {/* A <p>, not a heading: it is a standing brand line, not a title, and
            an <h2> above the <h1> would put the page's first two headings out
            of order for anyone navigating by heading.

            English in both locales on purpose — it is set copy rather than
            something to translate — but it still comes from the catalogues so
            it is editable in one place and the ES file does not silently
            diverge. The tracking is the whole effect at this size: 0.18em is
            wide enough that the line reads as spaced capitals rather than as
            small text that happens to be uppercase. */}
        <motion.p variants={fade(shouldReduceMotion, 0)} className={EYEBROW_CLASS}>
          {eyebrow}
        </motion.p>

        {/* NO max-width HERE, ON PURPOSE — do not reinstate one.
            A `ch` constraint cannot bind on this element. Clash Display's zero
            glyph is 0.681em at wght 300, so at the 1440px hero size (the
            7.5rem cap = 120px) a single `ch` is ~82px: even 12ch computes to
            ~981px, and anything loose enough to look reasonable in the source
            is wider than the 1104px content box (max-w-6xl 1152px less the
            48px of px-6) and therefore dead code. The container is the measure
            instead.

            Measured, not assumed: `--text-hero` rags this to four lines at
            1440 in both locales.

            `flex-col` only once it is split, and only to stop the masks'
            negative margins collapsing: between block siblings the browser
            takes the single most negative margin rather than the sum, and the
            first one would collapse through the heading itself and drag the
            whole stack up. Flex items do not collapse margins, so each line
            keeps its own -0.09em top and bottom and the arithmetic holds. */}
        <motion.h1
          ref={headlineRef}
          className={
            split.kind === 'lines' ? `${HEADLINE_CLASS} flex flex-col` : HEADLINE_CLASS
          }
          variants={
            split.kind === 'lines'
              ? fade(true, 0) // instant: the masks are still holding the lines
              : fade(shouldReduceMotion, HEAD_START)
          }
        >
          {split.kind === 'lines'
            ? split.lines.map((segments, index) => (
                <span key={index} className={MASK_CLASS}>
                  <motion.span
                    data-line=""
                    className="block"
                    variants={line(split.instant, index)}
                    // Each line drives itself, rather than inheriting the
                    // variant from the heading. Inheriting looked right and was
                    // not: a line is a grandchild (h1 > mask > line), and
                    // Chrome's animation list showed one line animating with no
                    // delay while the other three jumped straight to their
                    // resting position. The lines carry their own delays
                    // anyway, so they need nothing from the parent.
                    //
                    // `initial={false}` mounts a line at rest. That is for a
                    // re-split after the reveal: `hidden` would show a frame of
                    // empty masks mid-resize.
                    initial={split.instant ? false : 'hidden'}
                    animate="shown"
                  >
                    {segments.map((segment, segmentIndex) => {
                      if (!segment.tag) return segment.text
                      const Tag = segment.tag
                      return (
                        <Tag key={segmentIndex} className={segment.className}>
                          {segment.text}
                        </Tag>
                      )
                    })}
                  </motion.span>
                </span>
              ))
            : tagline}
        </motion.h1>

        {/* jb-700, not the jb-500 in the accent above: 500 fails AA at body
            size on paper. `46ch` does bind here, unlike on the h1: Satoshi's
            zero is just as wide (0.683em), but this is 17px type rather than
            158px, so a ch is ~11.6px and the measure lands at ~534px —
            comfortably inside the 1104px container. */}
        <motion.p
          variants={fade(shouldReduceMotion, tailDelay(lineCount))}
          className={LEAD_CLASS}
        >
          {lead}
        </motion.p>

        <motion.p
          variants={fade(shouldReduceMotion, tailDelay(lineCount))}
          className="mt-10 text-center md:text-left"
        >
          {cta}
        </motion.p>
      </motion.div>
    </>
  )
}
