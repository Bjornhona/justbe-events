'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { usePathname } from '@/i18n/routing'

/**
 * The only reason any of the header is a Client Component: it needs to know
 * whether the page has been scrolled past the hero.
 *
 * Everything inside arrives as `children` — already rendered on the server — so
 * the nav labels, the wordmark and the translations stay out of the client
 * bundle. This component ships the scroll listener and nothing else.
 *
 * `position: fixed` rather than `sticky`: "transparent over the hero" only
 * works if the header is out of flow and the hero starts at y=0. A sticky
 * header occupies its own strip at the top and can never overlay anything.
 * Pages without a hero therefore need `pt-18` on their first element.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  // The transparent state exists for exactly one thing: sitting over the hero
  // image at the top of the home page. Every other route starts with text on
  // paper, where a transparent header has no bottom border and reads as if it
  // is floating loose over the content — and on the legal pages it would sit
  // directly on top of the first heading.
  //
  // Keyed off "is this the home page" rather than a list of legal routes, so a
  // page added later is solid by default and only the one page with a hero
  // opts out. `usePathname` here is the one from `@/i18n/routing`: it returns
  // the *internal* path, so this is '/' for both /es and /en without having to
  // strip the locale.
  const pathname = usePathname()
  const overHero = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)

    // Run once on mount: the browser restores the previous scroll position on
    // reload and back-navigation, so we can hydrate already past the threshold
    // and never receive a scroll event to tell us.
    onScroll()

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={[
        'fixed inset-x-0 top-0 z-50 h-18',
        'transition-colors duration-300 ease-out motion-reduce:transition-none',
        scrolled || !overHero
          ? 'bg-paper/95 text-ink border-b border-line backdrop-blur-sm'
          : 'bg-transparent text-ink border-b border-transparent', // Also test with text-paper
      ].join(' ')}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        {children}
      </div>
    </header>
  )
}
