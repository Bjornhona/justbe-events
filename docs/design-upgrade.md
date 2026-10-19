# B·Events — design upgrade

Nine prompts. Run in order, one reviewable diff each.
**D1, D2 and D3 carry most of the visible difference** — if you only have an
evening, do those three and stop.

Place this file at `docs/design-upgrade.md` in the repo, so it travels with
the handover and Barbara's next developer can see what was deliberate.

---

## Before you start

**1. Fonts** — already done. `Clash Display` and `Satoshi` woff2 files in
`src/app/fonts/`. Both are Fontshare, commercial use included.

**2. Motion** — nothing to download. It is an npm package and D4 installs it
with `pnpm add motion`.

**3. Reduced-motion testing** — do it in Chrome DevTools, not macOS settings:
open DevTools → `⌘⇧P` → type "reduced motion" → **Emulate CSS
prefers-reduced-motion: reduce**. Toggle it per tab, no system change.
(The macOS setting, if you want it, is System Settings → Accessibility →
Display → Reduce motion.)

**4. Decide which band goes dark.** Recommendation: the Forbes/press section.
It is the trust moment, it sits roughly two-thirds down, and a near-black band
breaks the page in the right place.

---

## D1 — Typography

```
Replace both typefaces with the self-hosted Fontshare files already in
src/app/fonts/.

Display: Clash Display, via next/font/local, variable --font-display.
Body: Satoshi, via next/font/local, variable --font-sans.
Use the variable woff2 where present, otherwise the static weights.
display: "swap" on both, and set an adjustFontFallback or explicit fallback
stack so there is no layout shift on load.

Remove Geist, Geist Mono and Cormorant Garamond entirely — from the layout,
the font imports, and the @theme inline block in globals.css. Nothing may
still reference them.

Clash Display is wider and has a larger apparent size than Cormorant at the
same px, and it needs tighter tracking at display sizes. Set
letter-spacing: -0.03em on --text-display and -0.02em on --text-h2, and
re-check the hero at 390px and 1440px.

Keep every colour token untouched.

The logo stays as it is — it is a serif wordmark and that contrast with the
sans display is deliberate. Do not restyle it to match.
```

Stop and look at the page before continuing.

---

## D2 — Scale, space and asymmetry

The single biggest difference between a template and a designed page. Three
changes, one prompt.

```
Make the page bigger, emptier and less centred.

SCALE — increase the type scale roughly 25% at the top end:
  --text-display: clamp(3.25rem, 11vw, 11rem)
  --text-h2:      clamp(2.25rem, 5.5vw, 4.5rem)
  --text-h3:      clamp(1.375rem, 2.2vw, 2rem)
Leave body and small as they are. The crossover for --text-display must land
near 375px so phones are not pinned at the floor value — verify at 390px.

SPACE — increase section rhythm in Section.tsx:
  vertical padding clamp(7rem, 18vh, 14rem)
and give the hero and the dark band 1.5× that again. Empty space is the
effect, not a side-effect — do not compensate by enlarging anything else.

ASYMMETRY — stop centring everything:
- Hero: left-aligned on desktop (centred below md), headline max-width 16ch
- Positioning: offset into the right two-thirds of the grid, not centred
- Work cards: a 12-column grid where cards alternate 7 and 5 columns, with a
  vertical offset of about 4rem on every second card
- Pillars: keep the three columns, but let the middle one sit 2rem lower
- Section headings: left-aligned throughout, never centred

Mobile collapses everything to a single column — asymmetry is a desktop
device and reads as broken on a phone.

Verify: no horizontal scroll at 390px, 768px or 1440px.
```

---

## D3 — The dark band

```
Add a third tone to the Section component: tone="dark".

Background #1a1715, added as --color-ink-deep in @theme. Body text in
--color-paper, headings in white. Inside this section --color-jb-400 replaces
jb-700 for links and accents, because jb-700 fails contrast on near-black —
verify the pairing clears WCAG AA.

Apply tone="dark" to the Forbes/press section only.

Inside it: 1.5× the standard section padding, and the quote one step larger
than --text-h2. This band should read as a deliberate pause.

Afterwards, report the tone sequence of the whole page top to bottom and flag
any two adjacent sections that now share a background.
```

---

## D4 — Motion

```
pnpm add motion

Rewrite src/components/Reveal.tsx to use Motion's whileInView instead of the
hand-rolled IntersectionObserver:
- initial: opacity 0, y 16
- whileInView: opacity 1, y 0
- viewport: {once: true, margin: "-10% 0px"}
- transition: 0.5s, ease [0.16, 1, 0.3, 1]
- optional `delay` prop for staggering

useReducedMotion() short-circuits: render children with no animation and no
initial hidden state.

KEEP the existing <noscript> guard. Motion sets inline styles the same way,
so without it the content is invisible to link-preview crawlers again.

The public API must not change — every existing usage keeps working.
```

---

## D5 — Hero reveal

The page's one attention moment, so it should be the most considered animation
on it.

```
Add a line-by-line reveal to the hero headline.

Each rendered line sits in a wrapper with overflow hidden; the text moves from
y: 110% to y: 0. 80ms stagger between lines, 0.7s duration,
ease [0.16, 1, 0.3, 1].

The eyebrow fades in 200ms before the first line. The lead and the CTA fade in
after the last line completes.

Lines only — no character or word-level effect. They look cheap at display
size and break Spanish diacritics.

Constraints:
- The text must be present and readable in the SSR HTML, with no layout shift
  and no flash
- useReducedMotion renders everything in its final state immediately
- The line splitting must not break the <accent> span or the localised text.
  Verify in both /es and /en
```

---

## D6 — The dot motif

```
Use the teal dot from the logo as a recurring device. This ties the layout to
the wordmark and is the cheapest thing that makes a page feel designed.

Create src/components/Dot.tsx — a circle in --color-jb-500, sized via a
className prop, aria-hidden.

Five placements:
1. The list marker on services under each pillar (list-style none + Dot)
2. Inline before each section heading, as a small marker
3. The hero scroll cue becomes a dot with a slow pulse (2s ease-in-out,
   opacity 0.4 → 1), hidden under reduced-motion
4. Beneath the active locale in the language switcher
5. The separator between items in the footer meta line

Inside the dark section use --color-jb-400 so it stays visible.
```

---

## D7 — Schema and dummy data

Build this before D8 and D9 — it is what unblocks them.

```
Add two things to Sanity so Barbara can fill them in herself later, and seed
obvious placeholders now.

SCHEMA — add to siteSettings:
  clients: array of {name (string), logo (image), permissionGranted (boolean,
  default false), order (number)}

The four number fields (yearsActive, eventsDelivered, attendeesTotal,
countriesCount) already exist — leave them.

QUERY — project clients where permissionGranted == true ONLY, gated inside
the GROQ exactly as the project client names are. An uncleared logo must never
reach the JSON payload.

SEED — extend scripts/seed.ts with placeholder values:
- The four numbers: round, obviously provisional figures, and add a Studio
  description on each field saying "Pendiente de confirmar" so Barbara can see
  which are real
- Six clients with INVENTED names — "Grupo Maresme", "Aurora Brands",
  "Nordia", "Casal & Vidal", "Península", "Lumen Group" — each with
  permissionGranted: true so the layout can be built and seen

Generate a simple text-based wordmark SVG for each placeholder client rather
than using any real company's logo.

CRITICAL: do not seed Lidl, Nestlé or Longines, in any form. Placeholder data
that names a real company is a claim the site is not yet entitled to make.

Respect the --force guard: this must not overwrite Studio edits.
```

---

## D8 — Numbers count-up

```
Animate the Numbers section: count from 0 to the final value when it enters
the viewport, once, 1.2s, ease-out.

Motion's useMotionValue + animate, formatted through next-intl's number
formatter throughout the count, so Spanish shows 250.000 and English 250,000
at every frame.

Reduced-motion and no-JS both render the final value immediately.

Reserve the final width with tabular-nums or a min-width so the layout does
not shift as digits are added.
```

---

## D9 — Client logo marquee

```
Build the client wall as a marquee, reading from the clients array in
siteSettings.

Continuous horizontal scroll, right to left, ~40s per loop, seamless (the set
duplicated so there is no visible jump). Pauses on hover and on focus. Logos
at a uniform optical height, greyscale at 60% opacity, full colour on hover.

Render ONLY entries the query returned — the permission gate lives in GROQ,
do not re-check it here.

useReducedMotion: a static centred row instead.
On mobile: static wrapped row. A marquee on a phone is noise.

Place it directly above or below the dark band, whichever reads better once
D3 is in.
```

---

## What not to add

Spotlight borders, aurora backgrounds, text scramble, magnetic buttons, cursor
followers, parallax, 3D card tilt. Striking in isolation, and they make every
site using them look identical — wrong register for a serif wordmark and
Nestlé as a client.

Four animations total: hero lines, section reveals, numbers, marquee.

---

## Order and timing

| | Prompt | Time | Blocked on |
|---|---|---|---|
| 1 | D1 Typography | 45 min | — |
| 2 | D2 Scale, space, asymmetry | 1 h | — |
| 3 | D3 Dark band | 30 min | — |
| 4 | D4 Motion | 30 min | — |
| 5 | D5 Hero reveal | 1 h | — |
| 6 | D6 Dot motif | 45 min | — |
| 7 | D7 Schema + dummy data | 45 min | — |
| 8 | D8 Numbers count-up | 30 min | D7 |
| 9 | D9 Client marquee | 1 h | D7 |

Nothing is blocked on Barbara any more. Her real numbers and real client logos
replace the placeholders as Studio edits, with no code change.

---

## Before you call it done

- [ ] Reduced-motion emulated: every animation off, nothing invisible
- [ ] JavaScript disabled: all content present
- [ ] 390px / 768px / 1440px: no horizontal scroll, hero type still large
- [ ] Both locales: hero line splitting survives the accent span
- [ ] The dark band's teal clears AA for body text
- [ ] Lighthouse: Motion adds ~30KB gzipped — check the cost
- [ ] No placeholder client name is a real company
