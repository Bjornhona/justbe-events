import Contact from '@/components/sections/Contact'
import Forbes from '@/components/sections/Forbes'
import Hero from '@/components/sections/Hero'
import Numbers from '@/components/sections/Numbers'
import Pillars from '@/components/sections/Pillars'
import Positioning from '@/components/sections/Positioning'
import Work from '@/components/sections/Work'

/**
 * A fragment, not a wrapper element: every section is full-bleed and brings its
 * own background, and the layout already provides the <main> around them.
 *
 * The order alternates paper / alt all the way down, which is the only thing
 * separating one section from the next. Three of these hide themselves when the
 * dataset has nothing for them (`Work`, `Numbers`, `Forbes`), and when one does
 * its neighbours end up on the same tone and read as a single tall band. That
 * is the right trade — a stripe of empty paper is worse — but it is why the
 * tones are worth re-checking once the dataset is filled in.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Positioning />
      <Pillars />
      <Work />
      <Numbers />
      <Forbes />
      <Contact />
    </>
  )
}
