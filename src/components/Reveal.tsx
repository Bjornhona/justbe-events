'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * The only motion on the site. Children fade in and rise 16px as they enter the
 * viewport, once — no hover animations, parallax or stagger anywhere else.
 *
 * Reduced motion is enforced in CSS, not JS: the `motion-reduce:` utilities
 * below pin the children visible and untransformed inside a
 * `prefers-reduced-motion: reduce` media query. Because it is pure CSS it holds
 * before hydration, survives the user flipping the OS setting after load, and
 * needs no state. The matchMedia check in the effect only skips wiring up the
 * observer, so nothing is ever animated.
 */
export default function Reveal({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // No observer, no transition, no state change: the `motion-reduce:`
    // utilities below already render the children visible and untransformed,
    // so there is nothing left to do.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // A section already on screen at load is handled by the same callback:
    // IntersectionObserver fires once on observe, so there is no first-paint
    // special case to write.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShown(true)
        observer.disconnect() // once — never fades back out
      },
      // Holds the reveal until the element is a little way in, so it does not
      // trigger on the single pixel that clips the viewport edge.
      { rootMargin: '0px 0px -10% 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-reveal=""
      className={[
        'transition-[opacity,transform] duration-300 ease-out',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        'motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* With JS off the observer never runs, so the wrapper would keep its
          initial hidden state forever and the section would be blank. This
          puts it back to visible.

          `dangerouslySetInnerHTML` rather than JSX children: a browser with
          scripting *enabled* parses <noscript> contents as raw text, so React
          would find a text node where it expected a <style> element and report
          a hydration mismatch. Setting the HTML directly opts the subtree out
          of hydration entirely.

          Tailwind v4 animates the `translate` property, not `transform`; both
          are reset so this keeps working if that changes. The second rule drops
          the <noscript> out of flow, since with JS off it would otherwise be an
          inline box — or a flex/grid item — inside the wrapper. */}
      <noscript
        data-reveal-fallback=""
        dangerouslySetInnerHTML={{
          __html:
            '<style>[data-reveal]{opacity:1!important;translate:none!important;transform:none!important}noscript[data-reveal-fallback]{display:none}</style>',
        }}
      />
      {children}
    </div>
  )
}
