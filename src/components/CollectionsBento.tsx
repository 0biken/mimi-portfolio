import { motion } from 'motion/react'
import { collections, coverOf as cover, type Collection } from '../data/site'
import { Photo } from './Photo'
import { Reveal } from './Reveal'

// Large screens: a 12-column grid with one named area per collection. Cell shapes follow each
// lead photo (full-length looks get tall cells, duos and close-ups get wide ones).
const AREA: Record<string, string> = {
  'crowned-in-violet': 'a', 'fuchsia-in-full-bloom': 'b', 'cobalt-siren': 'c', 'twin-crowns': 'd',
  'soft-power-in-sage': 'e', 'ankara-sunday': 'f', 'runway-on-campus': 'g', 'off-duty-noir': 'h', 'garden-reverie': 'i',
}
const AREAS = `
  "a a a a a b b b b c c c" "a a a a a b b b b c c c" "a a a a a b b b b c c c" "a a a a a b b b b c c c"
  "a a a a a d d d d c c c" "e e e f f d d d d c c c" "e e e f f d d d d g g g" "e e e f f h h h h g g g"
  "i i i i i h h h h g g g" "i i i i i h h h h g g g" "i i i i i h h h h g g g"`

// Below 1024px: one column on phones, two on tablets; tall shots stay tall, the duo goes wide.
const SHAPE: Record<string, string> = { 'twin-crowns': 'aspect-[3/2]', 'garden-reverie': 'aspect-[3/2]' }

export function CollectionsBento({ onOpen }: { onOpen: (c: Collection) => void }) {
  return (
    <section id="collections" className="mx-auto max-w-[1400px] px-4 py-24 md:px-8 md:py-32">
      <Reveal>
        <h2 className="display max-w-[18ch] pb-1 text-5xl leading-[1.1] md:text-7xl">A little bit of <em>everything.</em></h2>
        <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted">
          Nine collections from studio, street and stage. Open one to see every frame.
        </p>
      </Reveal>

      <div className="bento mt-14 grid grid-cols-1 gap-x-5 gap-y-10 md:grid-cols-2 lg:mt-20 lg:gap-y-6">
        {collections.map((c, i) => (
          <Reveal key={c.slug} delay={(i % 3) * 0.06} className="flex min-h-0 flex-col" >
            <button type="button" onClick={() => onOpen(c)} className="group flex h-full min-h-0 flex-col text-left"
                    aria-label={`Open ${c.name}, ${c.frames.length} photographs`}>
              <motion.div layoutId={`cover-${c.slug}`}
                          className={`relative w-full overflow-hidden bg-surface ${SHAPE[c.slug] ?? 'aspect-[4/5]'} lg:aspect-auto lg:min-h-0 lg:flex-1`}>
                <Photo frame={cover(c)} sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw" alt=""
                       className="transition-transform duration-700 ease-out-strong group-hover:scale-[1.03]" />
              </motion.div>
              <span className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4">
                <span className="display whitespace-nowrap text-2xl">{c.name}</span>
                <span className="shrink-0 text-sm text-muted">{c.frames.length} photos</span>
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .bento { grid-template-columns: repeat(12, minmax(0, 1fr)); grid-template-rows: repeat(11, 5.5rem); grid-template-areas: ${AREAS}; }
          ${collections.map((c, i) => `.bento > :nth-child(${i + 1}) { grid-area: ${AREA[c.slug]}; }`).join(' ')}
        }
      `}</style>
    </section>
  )
}
