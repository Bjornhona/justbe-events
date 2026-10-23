import { Fragment, isValidElement, type ReactNode } from 'react'

/**
 * Where a heading's lines actually fall.
 *
 * Line breaks are not data — they are a layout result, produced by the browser
 * from the font, the measure, the tracking and `text-wrap: balance`. Nothing on
 * the server knows them. So the only honest way to animate "each rendered line"
 * is to lay the text out in the real font at the real width, read the line
 * boxes back, and rebuild the heading from what we measured.
 *
 * This module does that in two halves:
 *
 *   `toSegments`  — flattens rich text (`t.rich`, with its <accent> span) into
 *                   a flat list of styled runs, so the splitter works on text
 *                   plus a tag, not on an opaque React tree.
 *   `measureLines` — lays those runs out in a hidden probe and groups them into
 *                   lines by the vertical position the browser gave them.
 *
 * WORDS, NOT CHARACTERS. The probe wraps each word in its own element and reads
 * that element's position. Character-level measurement would be the obvious way
 * to find exact break points, but splitting a Spanish string into characters
 * puts a combining mark in its own box whenever the source is not normalised —
 * "cuándo" becomes "cua" + "´" + "ndo" — and breaks shaping. Whitespace is the
 * only place the browser can break this copy anyway (the one exception is
 * guarded for in `measureLines`), so words are both sufficient and safe.
 */

/**
 * Tags allowed inside a splittable heading. All five are inline and
 * style-only, so a run can be re-emitted on a different line without changing
 * meaning. Anything else — a <br>, a link, a component — makes the heading
 * unsplittable rather than silently mis-rendered: `toSegments` returns null and
 * the caller falls back to animating the heading as one block.
 */
const INLINE_TAGS = ['span', 'em', 'strong', 'b', 'i'] as const

type InlineTag = (typeof INLINE_TAGS)[number]

/** A run of text with the inline element, if any, that was wrapping it. */
export type Segment = { text: string; tag?: InlineTag; className?: string }

/** One rendered line, as the runs it is made of. */
export type Line = Segment[]

/** The inline wrapper a run inherited, carried down the walk. */
type Styling = { tag: InlineTag; className?: string }

/**
 * Flattens rich text into styled runs, or returns null if the tree contains
 * anything this cannot faithfully take apart and put back together.
 */
export function toSegments(node: ReactNode): Segment[] | null {
  const out: Segment[] = []
  if (!walk(node, undefined, out)) return null
  return out.some((segment) => segment.text.trim() !== '') ? out : null
}

function walk(node: ReactNode, styling: Styling | undefined, out: Segment[]): boolean {
  // Rendered as nothing, so it contributes nothing and is not a reason to bail.
  if (node == null || typeof node === 'boolean') return true

  if (typeof node === 'string' || typeof node === 'number') {
    out.push({ ...styling, text: String(node) })
    return true
  }

  if (Array.isArray(node)) return node.every((child) => walk(child, styling, out))

  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode; className?: string }

    // next-intl composes rich text out of arrays and fragments depending on
    // the message, so a fragment is a pass-through rather than a bail.
    if (node.type === Fragment) return walk(props.children, styling, out)

    if (typeof node.type !== 'string') return false
    if (!INLINE_TAGS.includes(node.type as InlineTag)) return false
    // One level only. Nesting would need the rebuilt line to reproduce a tree,
    // and no heading on this site has one.
    if (styling) return false

    return walk(props.children, { tag: node.type as InlineTag, className: props.className }, out)
  }

  return false
}

/** A word, the run it came from, and whether the source had a space after it. */
type Word = { text: string; segment: Segment; spaceAfter: boolean }

/**
 * Lays `segments` out at `width` and returns them grouped by rendered line, or
 * null if the result cannot be trusted (see the single-rect check below).
 *
 * The probe is mounted inside `parent` — the real heading's parent — so it
 * inherits the same computed font, and carries the heading's own `className` so
 * size, weight, tracking and `text-wrap: balance` are identical. It is
 * absolutely positioned and `visibility: hidden`: laid out, so it has line
 * boxes to read, but out of flow and invisible, so the page does not move.
 *
 * `width` is the heading's fractional content width, not a rounded one. Half a
 * pixel is enough to move the last word of a line at display size.
 */
export function measureLines({
  parent,
  width,
  className,
  tag,
  segments,
}: {
  parent: HTMLElement
  width: number
  className: string
  tag: string
  segments: Segment[]
}): Line[] | null {
  const words = toWords(segments)
  if (words.length === 0) return null

  const probe = document.createElement(tag)
  probe.className = className
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText = `position:absolute;top:0;left:0;width:${width}px;height:auto;visibility:hidden;pointer-events:none`
  // The real heading becomes a flex column once it is split (see HeroText), and
  // this element copies its classes. Forced back, so re-measuring lays the text
  // out the same way the un-split heading did.
  probe.style.display = 'block'

  const boxes = words.map((word) => {
    const box = document.createElement(word.segment.tag ?? 'span')
    if (word.segment.className) box.className = word.segment.className
    box.textContent = word.text
    probe.append(box)
    // A real text node, so the browser has the same break opportunities it
    // would have in the unsplit heading.
    if (word.spaceAfter) probe.append(document.createTextNode(' '))
    return box
  })

  parent.append(probe)

  const lines: Line[] = []
  let lineTop = 0

  try {
    for (let i = 0; i < words.length; i++) {
      const rects = boxes[i].getClientRects()

      // Exactly one rect means the word sits on one line. Two means the browser
      // broke inside it — a word longer than the measure, which `overflow-wrap`
      // or a hyphenation opportunity can produce at the small end of the type
      // scale. Grouping by position would then assign the whole word to one
      // line and the rebuilt line would be wider than its mask, which clips.
      // Better to report failure and let the caller fade the heading in whole.
      if (rects.length !== 1) return null

      const top = rects[0].top
      // Tolerance, not equality: tops within a line box are identical in
      // practice, and the next line is a whole line-height away — 122px at the
      // hero's 1440px size, 53px at its floor.
      if (lines.length === 0 || top - lineTop > 1) {
        lines.push([])
        lineTop = top
      }

      const line = lines[lines.length - 1]
      append(line, words[i].segment, words[i].text)
      // The space that followed the word is its own plain run, so it merges
      // into whichever neighbour is plain and never ends up inside the accent
      // span. Colour would not show it; an underline or a background would.
      if (words[i].spaceAfter) append(line, SPACE, ' ')
    }
  } finally {
    probe.remove()
  }

  for (const line of lines) {
    // A line never keeps the space that used to join it to the next one.
    const last = line[line.length - 1]
    last.text = last.text.replace(/\s+$/, '')
    if (last.text === '' && line.length > 1) line.pop()
  }

  return lines
}

/** The joining space: plain text, carrying no inline element. */
const SPACE: Segment = { text: ' ' }

/**
 * Splits the runs into words, recording the whitespace between them.
 *
 * The space is recorded on the word *before* it, which is what makes a run
 * boundary mid-sentence work: "…dónde, " ends with a space and <accent>solo</>
 * does not start with one, so the space has to be carried by the word that
 * precedes the accent, not by the accent itself.
 */
function toWords(segments: Segment[]): Word[] {
  const words: Word[] = []

  for (const segment of segments) {
    for (const part of segment.text.split(/(\s+)/)) {
      if (part === '') continue
      if (/^\s+$/.test(part)) {
        // Leading whitespace with no word before it is at the start of the
        // heading and renders as nothing.
        if (words.length > 0) words[words.length - 1].spaceAfter = true
        continue
      }
      words.push({ text: part, segment, spaceAfter: false })
    }
  }

  return words
}

/** Appends text to a line, merging it into the previous run where it can. */
function append(line: Line, segment: Segment, text: string) {
  const previous = line[line.length - 1]

  if (previous && previous.tag === segment.tag && previous.className === segment.className) {
    previous.text += text
    return
  }

  line.push({ ...segment, text })
}
