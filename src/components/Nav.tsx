import { useEffect, useState } from 'react'
import { motion, useScroll, useSpring } from 'motion/react'
import { CONTACT, links } from '../data/site'

/** Fixed nav. It turns to night colours over the dark story scenes and carries a thin reading-progress line. */
export function Nav() {
  const [dark, setDark] = useState(true)
  const [atTop, setAtTop] = useState(true)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 })

  useEffect(() => {
    let raf = 0
    const check = () => {
      raf = 0
      setAtTop(scrollY < 8)
      const scenes = document.querySelectorAll<HTMLElement>('[data-scene="dark"]')
      setDark([...scenes].some((s) => { const r = s.getBoundingClientRect(); return r.top <= 32 && r.bottom >= 32 }))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check) }
    check()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(raf) }
  }, [])

  return (
    <header className={`fixed inset-x-0 top-0 z-30 border-b transition-[background-color,border-color] duration-500 ${dark ? 'scene-dark' : ''} ${
      atTop ? 'border-transparent bg-transparent' : 'border-line bg-bg/85 backdrop-blur-md'}`}>
      <nav className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-4 md:px-8">
        <a href="#top" className="display text-2xl">Mimi Idunnu</a>
        <div className="flex items-center gap-8 text-sm">
          <a href="#collections" className="hidden text-muted transition-colors hover:text-ink md:block">Chapters</a>
          <a href="#collaborations" className="hidden text-muted transition-colors hover:text-ink md:block">Collaborations</a>
          <a href="#about" className="hidden text-muted transition-colors hover:text-ink md:block">Her story</a>
          <a href={links.instagram} target="_blank" rel="noopener noreferrer"
             className="border border-ink px-4 py-2 font-medium transition-[background-color,color,transform] duration-150 hover:bg-ink hover:text-on-ink active:scale-[0.97]">
            {CONTACT}
          </a>
        </div>
      </nav>
      <motion.div aria-hidden className="absolute inset-x-0 -bottom-px h-px origin-left bg-accent" style={{ scaleX: progress }} />
    </header>
  )
}
