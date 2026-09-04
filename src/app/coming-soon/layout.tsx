import type { Metadata } from 'next'
import { Geist } from 'next/font/google'

import '../globals.css'

// Its own document shell: app/layout.tsx is a pass-through that renders neither
// <html> nor <body>, and this route sits outside [locale] so it inherits none
// of that layout's setup. Only the sans face is loaded — nothing here is mono.
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'B·Vents',
  robots: { index: false, follow: false },
}

export default function ComingSoonLayout({
  children,
}: LayoutProps<'/coming-soon'>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
