import { useCallback, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { Photo } from './Photo'
import { Button } from './Button'
import { HeroCanvas } from './HeroCanvas'
import { CONTACT, links } from '../data/site'
import { canWebGL } from '../gl/gl'

const ease = [0.16, 1, 0.3, 1] as const
const HERO = 49

/** The prologue: a night scene with the portrait rising out of the plum. */
export function Hero() {
  const reduce = useReducedMotion()
  const [gl] = useState(() => !reduce && canWebGL())
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const ref = useRef<HTMLElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, delay: reduce ? 0 : delay, ease },
  })

  return (
    <section id="top" ref={ref} data-scene="dark" className="scene-dark relative isolate min-h-[100dvh] overflow-hidden bg-bg">
      <div className="absolute inset-0 lg:left-[42%]">
        {/* The <img> loads first and stays as the fallback; with WebGL the canvas draws the same file. */}
        <Photo ref={img} frame={HERO} priority sizes="(min-width: 1024px) 58vw, 100vw"
               alt="Mimi in a sculpted violet gele with gold floral print, against a dark olive studio backdrop"
               className={gl ? 'opacity-0' : 'animate-[fade_1.2s_ease-out]'} />
        {gl && <HeroCanvas frame={HERO} image={img} onReady={onReady} />}
        <div aria-hidden className={`absolute inset-0 transition-opacity duration-700 ${gl && !ready ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-x-0 bottom-0 h-[70%] bg-linear-to-t from-bg via-bg/70 to-transparent lg:hidden" />
          <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-bg/70 to-transparent" />
          <div className="absolute inset-y-0 left-0 hidden w-1/3 bg-linear-to-r from-bg to-transparent lg:block" />
        </div>
      </div>

      <motion.div style={{ y, opacity: fade }}
                  className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1400px] flex-col justify-end px-4 pb-14 pt-28 md:px-8 lg:justify-center lg:pb-24">
        <motion.p className="label text-accent" {...rise(0.6)}>Prologue</motion.p>
        <motion.h1 className="display mt-6 max-w-[9ch] pb-2 text-6xl leading-[1.02] md:text-8xl xl:text-[9.5rem]" {...rise(0.75)}>
          Beauty in <em>being you.</em>
        </motion.h1>
        <motion.p className="mt-7 max-w-[36ch] text-lg leading-relaxed text-muted" {...rise(0.95)}>
          The story of Mimi Idunnu, told in nine chapters of fashion, beauty and the everyday.
        </motion.p>
        <motion.div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-2" {...rise(1.1)}>
          <Button href="#collections" down>Begin the story</Button>
          <Button href={links.instagram} variant="line" external>{CONTACT}</Button>
        </motion.div>
      </motion.div>

      <motion.div aria-hidden className="absolute bottom-8 right-4 z-10 hidden items-center gap-4 md:right-8 lg:flex" {...rise(1.6)}>
        <span className="label text-muted">Scroll</span>
        <span className="relative h-px w-16 overflow-hidden bg-line">
          <span className="absolute inset-0 origin-left bg-ink motion-safe:animate-[scrollhint_2.4s_cubic-bezier(0.77,0,0.175,1)_infinite]" />
        </span>
      </motion.div>
    </section>
  )
}
