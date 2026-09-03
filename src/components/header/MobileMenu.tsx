'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

/**
 * Hamburger + full-screen overlay.
 *
 * The links inside are Server Components passed as `children`, so the labels
 * and the locale switcher are rendered on the server and this file only ships
 * the open/close behaviour.
 *
 * Closing on link click is done by delegation on the overlay rather than by
 * cloning the children and attaching handlers — that is what lets the children
 * stay server-rendered.
 */
export function MobileMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  // Move focus into the overlay when it opens and back to the hamburger when it
  // closes, so a keyboard user is never left focused on a hidden element.
  useEffect(() => {
    if (open) {
      closeRef.current?.focus()
    } else if (document.activeElement === document.body) {
      triggerRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
        return
      }

      if (event.key !== 'Tab') return

      // Keep Tab inside the overlay. Without this, tabbing past the last link
      // walks into the page behind, which is still there and still focusable.
      const focusable = overlayRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      )
      if (!focusable || focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    // Stop the page behind the overlay from scrolling.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const t = useTranslations('Nav')

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('openMenu')}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
      >
        <span aria-hidden="true" className="flex w-6 flex-col gap-1.5">
          <span className="h-px w-full bg-current" />
          <span className="h-px w-full bg-current" />
          <span className="h-px w-full bg-current" />
        </span>
      </button>

      {open && (
        <div
          ref={overlayRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label={t('mobile')}
          // Any click that lands on a link bubbles to here and closes the
          // overlay — including the locale switcher links.
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('a')) close()
          }}
          // The overlay is always paper, so it overrides the header's text
          // colour — which is `text-paper` while the header is transparent.
          className="fixed inset-0 z-50 flex flex-col bg-paper text-ink"
        >
          <div className="flex h-18 items-center justify-end px-4 sm:px-6">
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label={t('closeMenu')}
              className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700"
            >
              <span aria-hidden="true" className="relative block h-6 w-6">
                <span className="absolute top-1/2 left-0 h-px w-full rotate-45 bg-current" />
                <span className="absolute top-1/2 left-0 h-px w-full -rotate-45 bg-current" />
              </span>
            </button>
          </div>

          <div className="flex flex-1 flex-col justify-center gap-10 px-8 pb-24">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
