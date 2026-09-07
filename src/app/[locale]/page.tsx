import Hero from '@/components/sections/Hero'
import Pillars from '@/components/sections/Pillars'
import Positioning from '@/components/sections/Positioning'
import Work from '@/components/sections/Work'

/**
 * A fragment, not a wrapper element: every section is full-bleed and brings its
 * own background, and the layout already provides the <main> around them.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Positioning />
      <Pillars />
      <Work />
    </>
  )
}
