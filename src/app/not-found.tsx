import Link from 'next/link'

import './globals.css'

/**
 * Last-resort 404, outside the [locale] segment.
 *
 * Reached only by paths `proxy.ts` does not rewrite — anything with a file
 * extension, mainly — so a visitor should almost never see it. No next-intl:
 * there is no locale here and no messages are loaded, so the copy is hardcoded
 * in both languages rather than guessed.
 *
 * It renders its own <html> and <body> because app/layout.tsx is a
 * pass-through that renders neither. Without them this page is invalid HTML.
 */
export default function NotFound() {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center text-ink antialiased">
        <p className="text-sm font-semibold tracking-widest text-jb-700 uppercase">
          404
        </p>
        <p className="text-2xl font-semibold tracking-tight">
          Esta página no existe
        </p>
        <p className="text-ink-muted">This page does not exist</p>
        <Link
          href="/"
          className="mt-2 rounded-xs text-sm font-medium text-jb-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700"
        >
          B Vents
        </Link>
      </body>
    </html>
  )
}
