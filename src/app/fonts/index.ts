import localFont from 'next/font/local'

/**
 * The two self-hosted Fontshare faces, defined once.
 *
 * Both layouts that render an <html> element — `[locale]/layout.tsx` and
 * `gate/layout.tsx` — need these. Next hosts one instance per call to
 * `localFont`, so calling it in each layout would ship two copies of the same
 * @font-face under two different generated family names. Hence this module.
 *
 * ── WHY NOT `variable: '--font-display'` DIRECTLY ──────────────────────────
 * The tokens you author against are `--font-display` and `--font-sans`, but
 * those are Tailwind theme variables, declared in the `@theme inline` block in
 * `globals.css`. Naming the raw next/font output the same thing would make that
 * block read `--font-display: var(--font-display)` — circular, and it resolves
 * to nothing. So next/font emits `--font-clash` / `--font-satoshi`, and the
 * theme block aliases them. Change a name here and change it there too.
 *
 * Variable files only: one request per family covers the whole weight range,
 * and the static cuts in this folder stay unused. Keep them anyway — they are
 * the licensed download, and `font-variation-settings` support is the only
 * thing that would send us back to them.
 *
 * `adjustFontFallback: 'Arial'` makes Next emit a metric-adjusted fallback
 * (`size-adjust`, `ascent-override`, …) derived from Arial, so the paint before
 * the woff2 lands occupies the same box as the real face and nothing reflows.
 * Both of these are sans, so Arial is the right donor for both. The explicit
 * `fallback` array is what applies if the file genuinely fails to load.
 */

/** Display face — headings only. Variable, wght 200–700. */
export const clashDisplay = localFont({
  src: './ClashDisplay-Variable.woff2',
  weight: '200 700',
  style: 'normal',
  variable: '--font-clash',
  display: 'swap',
  adjustFontFallback: 'Arial',
  fallback: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
})

/**
 * Body face — everything else. Variable, wght 300–900.
 *
 * The italic axis is a separate file: prose from Sanity can contain <em>, and
 * without it the browser synthesises a slant by shearing the upright.
 */
export const satoshi = localFont({
  src: [
    {
      path: './Satoshi-Variable.woff2',
      weight: '300 900',
      style: 'normal',
    },
    {
      path: './Satoshi-VariableItalic.woff2',
      weight: '300 900',
      style: 'italic',
    },
  ],
  variable: '--font-satoshi',
  display: 'swap',
  adjustFontFallback: 'Arial',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
})
