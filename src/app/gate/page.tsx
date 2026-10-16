// The page behind both closed states of the site. `src/proxy.ts` rewrites
// every public request here while SITE_GATE is set, and passes the reason in
// `?mode=`; nothing links here and nothing navigates here.
//
// The two modes differ in exactly two things — the sentence, and whether the
// page asks not to be indexed. Logo, mailto, fiscal line and the "Acceder"
// link are the same in both, because the visitor's question ("is this the right
// company, how do I reach them") is the same either way.
//
// coming-soon goes at launch along with `src/app/api/preview/` and the
// "Acceder" link to `src/app/gate/access/`; maintenance stays. See the
// launch-day list in `src/app/robots.ts`.
import type { Metadata } from 'next'

import Logo from '@/components/Logo'

type Mode = 'coming-soon' | 'maintenance'

const MESSAGES = {
  'coming-soon': { es: 'Nueva web en camino.', en: 'New website on its way.' },
  maintenance: {
    es: 'Volvemos en unos minutos.',
    en: 'Back in a few minutes.',
  },
} as const satisfies Record<Mode, { es: string; en: string }>

// Anything other than the exact string "maintenance" reads as coming-soon:
// an unrecognised or absent mode should fail to the quieter, noindexed page.
function readMode(mode: string | string[] | undefined): Mode {
  return mode === 'maintenance' ? 'maintenance' : 'coming-soon'
}

export async function generateMetadata({
  searchParams,
}: PageProps<'/gate'>): Promise<Metadata> {
  const mode = readMode((await searchParams).mode)

  // coming-soon is served as 200, so this meta tag is the only thing keeping
  // the holding page out of the index. maintenance is served as 503, which
  // already tells crawlers to come back later and keep whatever they have —
  // a noindex there would invite them to drop pages that are only hidden for
  // a few minutes.
  return mode === 'coming-soon' ? { robots: { index: false, follow: false } } : {}
}

export default async function GatePage({ searchParams }: PageProps<'/gate'>) {
  const message = MESSAGES[readMode((await searchParams).mode)]

  return (
    <main className="flex min-h-screen flex-col bg-paper px-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <Logo className="w-[280px] max-w-full text-ink-body" />
        <div className="space-y-1 text-sm text-ink-muted">
          <p>{message.es}</p>
          <p lang="en">{message.en}</p>
        </div>
        <a
          href="mailto:events@b-events.es"
          className="text-sm text-jb-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700"
        >
          events@b-events.es
        </a>
      </div>
      {/* The fiscal line, and tucked into the corner on the same line, the way
          in: 11px at reduced opacity, because a visitor who reads it should
          conclude it is not for them. `nofollow` and the `/gate` disallow in
          `src/app/robots.ts` keep it out of the index — the quietness is for
          people, those two are for crawlers. */}
      <div className="relative pb-8">
        {/* The side padding is the link's room: it is invisible at any normal
            width, and on a narrow phone it makes the fiscal line wrap rather
            than run under "Acceder". */}
        <p className="px-12 text-center text-xs text-ink-muted">
          Barbara Juan Portoles Events SL · B93941276
        </p>
        {/* A plain <a>, not <Link>: the login page is in its own layout and
            behind the gate rewrite, so this is a document load, not a client
            navigation — and <Link> would prefetch a page nobody but the client
            should ever open. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/gate/access"
          rel="nofollow"
          className="absolute bottom-8 right-0 text-[11px] text-ink-muted/60 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700"
        >
          Acceder
        </a>
      </div>
    </main>
  )
}
