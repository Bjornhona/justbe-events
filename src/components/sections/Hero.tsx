import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/routing'
import HeroText from '@/components/sections/HeroText'

/**
 * Server Component. No image: the tagline is the hero, so the only things
 * competing for attention are the type and the single accent word.
 *
 * The accent is a rich-text tag rather than a split string, because the word
 * that carries the brand is not the same word in both languages — "just" in
 * English, "solo" in Spanish — and it sits mid-sentence in each. Translators
 * move the tag; nothing here needs to know where it landed. The line-by-line
 * reveal in `HeroText` takes the headline apart and puts it back together
 * around that span wherever it ended up.
 *
 * This file keeps the copy, the CTA's destination and the section box. The four
 * text blocks and their classes live in `HeroText`, which has to own them: it
 * animates each one, and the lead and the CTA cannot be timed until the browser
 * has told it how many lines the headline rags to.
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
          edge on a short screen.

          15vh, not the 18vh of the standard `Section.tsx` rhythm. The hero is
          the one section that has to fit five things on one screen, and the
          eyebrow added 52px to a stack that already filled a 1440x800 laptop:
          at 18vh the CTA fell 8px below the fold and the scroll cue 12px. The
          3vh difference is 24px at that height — just enough, and it only
          comes off the top, so the bottom of the hero is unchanged. */}
      <div className="mx-auto w-full max-w-6xl px-4 py-[clamp(7rem,15vh,14rem)] sm:px-6">
        <HeroText
          eyebrow={t('eyebrow')}
          tagline={t.rich('tagline', {
            accent: (chunks) => <span className="text-jb-500">{chunks}</span>,
          })}
          lead={t('lead')}
          cta={
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
          }
        />
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
