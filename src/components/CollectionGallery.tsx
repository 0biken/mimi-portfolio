import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'motion/react'
import { ArrowLeft, ArrowRight, X } from '@phosphor-icons/react'
import type { Collection } from '../data/site'
import { Photo } from './Photo'

const ease = [0.32, 0.72, 0, 1] as const

/** Full-screen collection view. The cover morphs out of its bento cell; any frame opens a lightbox. */
export function CollectionGallery({ collection, onClose }: { collection: Collection; onClose: () => void }) {
  const reduce = useReducedMotion()
  const dialog = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)
  const frames = collection.frames

  // Scroll lock, initial focus and Esc / Tab handling while open.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); if (active !== null) setActive(null); else onClose() }
      if (active !== null && e.key === 'ArrowRight') setActive((active + 1) % frames.length)
      if (active !== null && e.key === 'ArrowLeft') setActive((active - 1 + frames.length) % frames.length)
      if (e.key === 'Tab' && dialog.current) {
        const items = [...dialog.current.querySelectorAll<HTMLElement>('button, a[href]')].filter((el) => el.offsetParent !== null)
        const first = items[0], last = items.at(-1)
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [active, frames.length, onClose])

  const step = (dir: number) => setActive((i) => (i === null ? i : (i + dir + frames.length) % frames.length))
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 400) step(info.offset.x < 0 ? 1 : -1)
  }

  return (
    <motion.div
      ref={dialog} role="dialog" aria-modal="true" aria-label={collection.name}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-bg"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
    >
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 pb-24 pt-6 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100dvh-3rem)] lg:self-start">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">{frames.length} photos</span>
            <button type="button" data-autofocus onClick={onClose}
                    className="inline-flex items-center gap-2 py-2 text-sm font-medium transition-transform active:scale-[0.97]">
              Close <X size={18} aria-hidden />
            </button>
          </div>
          <div className="mt-4 flex h-[calc(100%-3rem)] flex-col">
            <motion.div layoutId={`cover-${collection.slug}`} transition={{ duration: reduce ? 0 : 0.5, ease }}
                        className="aspect-[4/5] overflow-hidden bg-surface lg:aspect-auto lg:min-h-0 lg:flex-1">
              <button type="button" onClick={() => setActive(0)} aria-label={`View photo 1 of ${frames.length}`} className="block h-full w-full">
                <Photo frame={frames[0]} sizes="(min-width: 1024px) 42vw, 100vw" alt="" />
              </button>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: reduce ? 0 : 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.5, ease }}>
              <h2 className="display mt-6 pb-1 text-4xl leading-[1.1] md:text-5xl">{collection.name}</h2>
              <p className="display mt-3 max-w-[44ch] text-xl italic leading-snug text-muted">{collection.line}</p>
              <p className="mt-4 text-sm text-muted">{collection.mood.join(', ')}</p>
            </motion.div>
          </div>
        </aside>

        <ul className="columns-1 gap-4 sm:columns-2 [&>li]:mb-4">
          {/* The cover already sits in the sidebar, so the masonry starts at the second frame. */}
          {frames.map((f, i) => i > 0 && (
            <motion.li key={f.frame} className="break-inside-avoid"
                       initial={{ opacity: 0, y: reduce ? 0 : 16 }} animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.15 + Math.min(i - 1, 8) * 0.05, duration: 0.5, ease }}>
              <button type="button" onClick={() => setActive(i)} aria-label={`View photo ${i + 1} of ${frames.length}`}
                      className="group block w-full overflow-hidden bg-surface" style={{ aspectRatio: `${f.width} / ${f.height}` }}>
                <Photo frame={f} sizes="(min-width: 1024px) 28vw, (min-width: 640px) 50vw, 100vw" alt=""
                       className="transition-transform duration-500 ease-out-strong group-hover:scale-[1.02]" />
              </button>
            </motion.li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {active !== null && (
          <motion.div className="fixed inset-0 z-10 flex items-center justify-center bg-[#140a18]/95"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      onClick={() => setActive(null)}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={frames[active].frame} className="h-[86dvh] w-[92vw] max-w-[1100px]"
                          initial={{ opacity: 0, scale: reduce ? 1 : 0.98 }} animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }} transition={{ duration: 0.25, ease }}
                          drag={reduce ? false : 'x'} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.25} onDragEnd={onDragEnd}
                          onClick={(e) => e.stopPropagation()}>
                <Photo frame={frames[active]} sizes="92vw" alt={`${collection.name}, photo ${active + 1} of ${frames.length}`}
                       className="!object-contain" style={{ objectPosition: 'center' }} />
              </motion.div>
            </AnimatePresence>
            {[{ dir: -1, Icon: ArrowLeft, label: 'Previous photo', pos: 'left-3 md:left-6' },
              { dir: 1, Icon: ArrowRight, label: 'Next photo', pos: 'right-3 md:right-6' }].map(({ dir, Icon, label, pos }) => (
              <button key={dir} type="button" aria-label={label} onClick={(e) => { e.stopPropagation(); step(dir) }}
                      className={`absolute ${pos} top-1/2 -translate-y-1/2 p-3 text-[#F6EFE8] transition-transform active:scale-[0.94]`}>
                <Icon size={28} aria-hidden />
              </button>
            ))}
            <button type="button" aria-label="Close photo" onClick={() => setActive(null)}
                    className="absolute right-3 top-3 p-3 text-[#F6EFE8] transition-transform active:scale-[0.94] md:right-6 md:top-6">
              <X size={26} aria-hidden />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
