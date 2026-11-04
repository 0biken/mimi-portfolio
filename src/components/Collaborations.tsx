import { useRef, useState, useEffect } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import { Photo } from './Photo'
import { Button } from './Button'

type Project = { name: string; kind: string; body: string; credits: string; href: string; cta: string; frames: number[]; alt: string }

// Copy and credits carried over from the previous site. Photo sets are matched by the watermarks
// in the album (FnT Visuals on the gele glam set, the Empire signature on the studio sets).
const PROJECTS: Project[] = [
  {
    name: 'The Lorpe Brand', kind: 'Fashion, beauty and cultural storytelling',
    body: 'A traditional Yoruba fashion editorial bringing together elegant styling, beauty artistry and collaborative visual production.',
    credits: 'Fashion @the_lorpebrand. Makeup @nikkypearl_beauty. Gele @nikkygele. Photography @mo_photography_studio. Video @fnt_visualsss.',
    href: 'https://www.instagram.com/reel/DejNPjOIQtE/', cta: 'View the campaign', frames: [40, 38, 41],
    alt: 'Sage gele and satin, soft glam close-up',
  },
  {
    name: 'Kaz Empire', kind: 'Fashion, photography and visual expression',
    body: 'A vibrant creative photography collaboration exploring bold colours, expressive styling and editorial-inspired imagery.',
    credits: 'Creative and photography @kaz_empire. Featured creative account @pexels.africa.',
    href: 'https://www.instagram.com/p/De9bWHdgr79/', cta: 'View the collaboration', frames: [53, 58, 66],
    alt: 'Violet gele studio portrait on an olive backdrop',
  },
]

function ProjectCopy({ p, onActive }: { p: Project; onActive: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.6 })
  useEffect(() => { if (inView) onActive() }, [inView, onActive])
  return (
    <article ref={ref} className="flex flex-col justify-center py-10 lg:min-h-[85dvh] lg:py-0">
      {/* Phones and tablets get the images inline; desktop uses the sticky frame. */}
      <div className="mb-8 grid grid-cols-[2fr_1fr] gap-3 lg:hidden">
        <div className="row-span-2 aspect-[4/5] overflow-hidden"><Photo frame={p.frames[0]} sizes="66vw" alt={p.alt} /></div>
        <div className="overflow-hidden"><Photo frame={p.frames[1]} sizes="33vw" alt="" /></div>
        <div className="overflow-hidden"><Photo frame={p.frames[2]} sizes="33vw" alt="" /></div>
      </div>
      <p className="text-sm text-muted">{p.kind}</p>
      <h3 className="display mt-3 text-4xl md:text-6xl">{p.name}</h3>
      <p className="mt-6 max-w-[48ch] text-lg leading-relaxed">{p.body}</p>
      <p className="mt-5 max-w-[56ch] text-sm leading-relaxed text-muted">{p.credits}</p>
      <div className="mt-6"><Button href={p.href} variant="line" external>{p.cta}</Button></div>
    </article>
  )
}

export function Collaborations() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const p = PROJECTS[active]
  return (
    <section id="collaborations" className="bg-surface">
      <div className="mx-auto max-w-[1400px] px-4 py-24 md:px-8 md:py-32 lg:pb-0">
        <p className="label mb-6 text-muted">Interlude: the collaborations</p>
        <h2 className="display max-w-[16ch] pb-1 text-5xl leading-[1.1] md:text-7xl">Stories, <em>beautifully told.</em></h2>
        <div className="mt-10 grid lg:mt-0 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="sticky top-16 hidden h-[calc(100dvh-4rem)] items-center lg:flex">
            <div className="grid h-[78%] w-full grid-cols-[2fr_1fr] grid-rows-2 gap-4">
              {[0, 1, 2].map((slot) => (
                <div key={slot} className={`relative overflow-hidden bg-bg ${slot === 0 ? 'row-span-2' : ''}`}>
                  <AnimatePresence initial={false}>
                    <motion.div key={`${active}-${slot}`} className="absolute inset-0"
                                initial={{ opacity: 0, scale: reduce ? 1 : 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                transition={{ duration: 0.7, delay: slot * 0.06, ease: [0.16, 1, 0.3, 1] }}>
                      <Photo frame={p.frames[slot]} sizes={slot === 0 ? '36vw' : '18vw'} alt={slot === 0 ? p.alt : ''} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
          <div className="divide-y divide-line lg:pb-16">
            {PROJECTS.map((proj, i) => <ProjectCopy key={proj.name} p={proj} onActive={() => setActive(i)} />)}
          </div>
        </div>
      </div>
    </section>
  )
}
