import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { Photo } from './Photo'
import { Reveal } from './Reveal'

const SERVICES = [
  { name: 'Short-form videos', note: 'Reels and TikToks with a point of view', frame: 57 },
  { name: 'Fashion and beauty photography', note: 'Editorial, studio and outdoor shoots', frame: 14 },
  { name: 'Brand and product features', note: 'Products placed in a real story', frame: 52 },
  { name: 'Lifestyle storytelling', note: 'Everyday moments worth sharing', frame: 5 },
]

/** Big type rows. On a mouse, a photo follows the cursor; on touch, each row shows its thumbnail. */
export function Services() {
  const reduce = useReducedMotion()
  const list = useRef<HTMLUListElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const x = useMotionValue(0), y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 260, damping: 30 }), sy = useSpring(y, { stiffness: 260, damping: 30 })

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !list.current) return
    const r = list.current.getBoundingClientRect()
    x.set(e.clientX - r.left); y.set(e.clientY - r.top)
  }

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-24 md:px-8 md:py-32">
      <Reveal>
        <p className="label mb-6 text-muted">The craft</p>
        <h2 className="display pb-1 text-5xl leading-[1.1] md:text-7xl">Ideas made <em>to connect.</em></h2>
        <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-muted">
          From a first idea to the final frame, I work with brands and creative teams to make thoughtful content with a personal point of view.
        </p>
      </Reveal>

      <ul ref={list} onPointerMove={onMove} onPointerLeave={() => setHover(null)} className="relative mt-14 divide-y divide-line">
        {SERVICES.map((s, i) => (
          <li key={s.name} onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(i)}
              className="grid grid-cols-[4.5rem_1fr] items-center gap-5 py-7 md:grid-cols-[1fr_auto] md:py-9">
            <div className="aspect-square overflow-hidden md:hidden"><Photo frame={s.frame} sizes="72px" alt="" /></div>
            <p className={`display text-3xl transition-colors duration-200 md:text-6xl ${hover !== null && hover !== i ? 'md:text-muted' : ''}`}>{s.name}</p>
            <p className="col-start-2 text-muted md:col-start-auto">{s.note}</p>
          </li>
        ))}

        <AnimatePresence>
          {hover !== null && !reduce && (
            <motion.div aria-hidden className="pointer-events-none absolute left-0 top-0 z-10 hidden h-64 w-48 overflow-hidden md:block"
                        style={{ x: sx, y: sy, translateX: '-50%', translateY: '-50%' }}
                        initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}>
              <Photo frame={SERVICES[hover].frame} sizes="192px" alt="" />
            </motion.div>
          )}
        </AnimatePresence>
      </ul>
    </section>
  )
}
