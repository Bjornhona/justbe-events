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
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal>
          <h1 className="font-display text-display text-ink mx-auto max-w-[20ch] text-center font-light text-balance sm:mx-0 sm:text-left">
            {t.rich('tagline', {
              accent: (chunks) => <span className="text-jb-500">{chunks}</span>,
            })}
          </h1>

          {/* jb-700, not the jb-500 above: 500 fails AA at body size on paper. */}
          <p className="text-body text-ink-muted mx-auto mt-8 max-w-[46ch] text-center sm:mx-0 sm:text-left">
            {t('lead')}
          </p>

          <p className="mt-10 text-center sm:text-left">
            <Link
              href={{ pathname: '/', hash: 'contacto' }}
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
