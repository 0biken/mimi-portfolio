import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup } from 'motion/react'
import type { Collection } from './data/site'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Journey } from './components/Journey'
import { CollectionGallery } from './components/CollectionGallery'
import { Collaborations } from './components/Collaborations'
import { About } from './components/About'
import { Services } from './components/Services'
import { PhotoMarquee } from './components/PhotoMarquee'
import { Contact, Footer } from './components/Contact'

export default function App() {
  const [open, setOpen] = useState<Collection | null>(null)
  const trigger = useRef<HTMLElement | null>(null)

  const show = useCallback((c: Collection) => { trigger.current = document.activeElement as HTMLElement; setOpen(c) }, [])
  const close = useCallback(() => setOpen(null), [])

  return (
    <LayoutGroup>
      {/* The page goes inert behind the gallery so focus and screen readers stay in the dialog. */}
      <div inert={open !== null}>
        <Nav />
        <main>
          <Hero />
          <Journey onOpen={show} />
          <Collaborations />
          <About />
          <Services />
          <PhotoMarquee />
          <Contact />
        </main>
        <Footer />
      </div>
      <AnimatePresence onExitComplete={() => trigger.current?.focus({ preventScroll: true })}>
        {open && <CollectionGallery key={open.slug} collection={open} onClose={close} />}
      </AnimatePresence>
    </LayoutGroup>
  )
}
