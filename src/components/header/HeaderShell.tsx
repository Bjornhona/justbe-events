'use client'

import { useEffect, useState, type ReactNode } from 'react'

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
        scrolled
          ? 'bg-paper/95 text-ink border-b border-line backdrop-blur-sm'
          : 'bg-transparent text-paper border-b border-transparent',
      ].join(' ')}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        {children}
      </div>
    </header>
  )
}
