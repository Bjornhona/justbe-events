import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/routing'
import Reveal from '@/components/Reveal'

/**
 * Server Component. No image: the tagline is the hero, so the only things
 * competing for attention are the type and the single accent word.
 *
 * The accent is a rich-text tag rather than a split string, because the word
 * that carries the brand is not the same word in both languages — "just" in
 * English, "solo" in Spanish — and it sits mid-sentence in each. Translators
 * move the tag; nothing here needs to know where it landed.
 *
 * `min-h-svh` rather than `min-h-screen`: on mobile Safari `100vh` includes the
 * retracting URL bar, which pushes the scroll cue below the fold on load.
 */
export default async function Hero() {
  const t = await getTranslations('Hero')

  return (
    <section className="bg-paper relative flex min-h-svh flex-col justify-center">
      {/* A full-height hero takes its space from the viewport, not from a
          padding multiplier: `min-h-svh` above is the measurement, and this
          padding only has to keep the type off the header and off the bottom
          edge on a short screen. It is the standard `Section.tsx` rhythm,
          which is why the hero no longer runs past one screen. */}
      <div className="mx-auto w-full max-w-6xl px-4 py-[clamp(7rem,18vh,14rem)] sm:px-6">
        <Reveal>
          {/* NO max-width HERE, ON PURPOSE — do not reinstate one.
              A `ch` constraint cannot bind on this element. Clash Display's
              zero glyph is 0.681em at wght 300, so at the 1440px hero size
              (the 7.5rem cap = 120px) a single `ch` is ~82px: even 12ch
              computes to ~981px, and anything loose enough to look reasonable
              in the source is wider than the 1104px content box (max-w-6xl
              1152px less the 48px of px-6) and therefore dead code. The
              container is the measure instead.

              Measured, not assumed: `--text-hero` rags this to four lines at
              1440 in both locales. */}
          <h1 className="font-display text-hero text-ink text-center font-light text-balance md:text-left">
            {t.rich('tagline', {
              accent: (chunks) => <span className="text-jb-500">{chunks}</span>,
            })}
          </h1>

          {/* jb-700, not the jb-500 above: 500 fails AA at body size on paper.
              `46ch` does bind here, unlike on the h1 above: Satoshi's zero is
              just as wide (0.683em), but this is 17px type rather than 158px,
              so a ch is ~11.6px and the measure lands at ~534px — comfortably
              inside the 1104px container. */}
          <p className="text-body text-ink-muted mx-auto mt-8 max-w-[46ch] text-center md:mx-0 md:text-left">
            {t('lead')}
          </p>

          <p className="mt-10 text-center md:text-left">
            <Link
              href={{ pathname: '/', hash: 'section-contact' }}
              className="text-jb-700 group relative inline-block rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
            >
              {t('cta')}
              {/* Wipes in from the left and out to the right, so the underline
                  reads as one continuous stroke rather than a fade. */}
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-current transition-transform duration-300 ease-out group-hover:origin-left group-hover:scale-x-100 group-focus-visible:origin-left group-focus-visible:scale-x-100 motion-reduce:transition-none"
              />
            </Link>
          </p>
        </Reveal>
      </div>

      {/* Decorative, so it is not announced and carries no string to translate.
          Hidden outright under reduced motion — a static line at the foot of
          the hero would read as a stray rule rather than an invitation. */}
      <span
        aria-hidden="true"
        className="bg-ink-muted/40 pointer-events-none absolute inset-x-0 bottom-10 mx-auto h-10 w-px animate-bounce motion-reduce:hidden"
      />
    </section>
  )
}
