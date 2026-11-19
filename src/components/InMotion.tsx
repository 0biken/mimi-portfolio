import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import videos from '../data/videos.json'
import { Reveal } from './Reveal'

type Clip = (typeof videos)[number]

/** One muted, looping clip. It plays only while mostly on screen, and never autoplays with reduced motion. */
function ClipCard({ clip, autoplay }: { clip: Clip; autoplay: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v || !autoplay) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) void v.play().catch(() => {})
      else v.pause()
    }, { threshold: 0.6 })
    io.observe(v)
    return () => io.disconnect()
  }, [autoplay])

  const toggle = () => { const v = ref.current; if (v) void (v.paused ? v.play().catch(() => {}) : v.pause()) }
  return (
    <figure className="w-[62vw] max-w-[260px] shrink-0 snap-start sm:w-[240px]">
      <button type="button" onClick={toggle} aria-label="Play or pause clip" className="block w-full overflow-hidden bg-surface"
              style={{ aspectRatio: `${clip.width} / ${clip.height}` }}>
        <video ref={ref} src={clip.src} poster={clip.poster} muted loop playsInline preload="none"
               width={clip.width} height={clip.height} className="block h-full w-full object-cover" />
      </button>
    </figure>
  )
}

export function InMotion() {
  const reduce = useReducedMotion()
  return (
    <section id="in-motion" aria-labelledby="motion-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <Reveal>
          <h2 id="motion-title" className="display max-w-[18ch] pb-1 text-5xl leading-[1.1] md:text-7xl">In <em>motion.</em></h2>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted">
            Short clips from set, salon and studio. Tap any clip to play or pause; they play silently.
          </p>
        </Reveal>
      </div>
      <div className="mt-14 flex snap-x gap-4 overflow-x-auto px-4 pb-4 md:px-8 lg:mt-20" tabIndex={0} role="group" aria-label="Video clips">
        {videos.map((c) => <ClipCard key={c.id} clip={c} autoplay={!reduce} />)}
      </div>
    </section>
  )
}
