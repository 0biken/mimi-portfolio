import { InstagramLogo, TiktokLogo } from '@phosphor-icons/react'
import { Photo } from './Photo'
import { links } from '../data/site'

const STRIP = [62, 25, 41, 3, 65, 45, 13, 47, 52, 7, 38, 58]

/** The page's one marquee: a moving contact sheet that leads to the social accounts. */
export function PhotoMarquee() {
  return (
    <section aria-label="More photos on Instagram and TikTok" className="border-y border-line py-10">
      <div className="marquee overflow-hidden motion-reduce:overflow-x-auto">
        <div className="marquee-track flex w-max gap-3">
          {[...STRIP, ...STRIP].map((n, i) => (
            <div key={i} className="h-64 w-48 shrink-0 overflow-hidden md:h-80 md:w-60" aria-hidden={i >= STRIP.length}>
              <Photo frame={n} sizes="240px" alt="" />
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-[1400px] flex-wrap items-center gap-x-8 gap-y-3 px-4 md:px-8">
        <p className="text-muted">More on</p>
        <a href={links.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium underline decoration-line underline-offset-8 hover:decoration-accent">
          <InstagramLogo size={20} aria-hidden /> @idunnuoluwam
        </a>
        <a href={links.tiktok} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium underline decoration-line underline-offset-8 hover:decoration-accent">
          <TiktokLogo size={20} aria-hidden /> @mimi_idunnu
        </a>
      </div>
    </section>
  )
}
