import { moreCollections, coverOf, type Collection } from '../data/site'
import { Photo } from './Photo'
import { Reveal } from './Reveal'

/** Newer shoots, in a plain grid after the chapters. Opens the same gallery as the chapters. */
export function MoreCollections({ onOpen }: { onOpen: (c: Collection) => void }) {
  if (!moreCollections.length) return null
  return (
    <section id="more-collections" className="mx-auto max-w-[1400px] px-4 py-24 md:px-8 md:py-32">
      <Reveal>
        <h2 className="display max-w-[18ch] pb-1 text-5xl leading-[1.1] md:text-7xl">And <em>more.</em></h2>
        <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted">
          Newer shoots: campus colour, beauty close-ups, nails and studio tailoring. Open one to see every frame.
        </p>
      </Reveal>
      <div className="mt-14 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
        {moreCollections.map((c, i) => (
          <Reveal key={c.slug} delay={(i % 3) * 0.06} className="flex min-h-0 flex-col">
            <button type="button" onClick={() => onOpen(c)} className="group flex flex-col text-left"
                    aria-label={`Open ${c.name}, ${c.frames.length} photographs`}>
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface">
                <Photo frame={coverOf(c)} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" alt=""
                       className="transition-transform duration-700 ease-out-strong group-hover:scale-[1.03]" />
              </div>
              <span className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4">
                <span className="display text-2xl">{c.name}</span>
                <span className="shrink-0 text-sm text-muted">{c.frames.length} photos</span>
              </span>
              <span className="mt-1 text-sm leading-relaxed text-muted">{c.line}</span>
            </button>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
