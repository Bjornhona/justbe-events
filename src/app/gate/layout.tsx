import type { Metadata } from 'next'
import { Geist } from 'next/font/google'

import '../globals.css'

// Its own document shell: app/layout.tsx is a pass-through that renders neither
// <html> nor <body>, and this route sits outside [locale] so it inherits none
// of that layout's setup. Only the sans face is loaded — nothing here is mono.
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

// Only the title lives here. `robots` is per-mode and comes from the page's
// generateMetadata, because only the page can see `?mode=`.
export const metadata: Metadata = {
  title: 'B Events',
}

export default function GateLayout({ children }: LayoutProps<'/gate'>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
