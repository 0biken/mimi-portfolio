import { Photo } from './Photo'
import { Reveal } from './Reveal'

export function About() {
  return (
    <section id="about" className="mx-auto grid max-w-[1400px] gap-14 px-4 py-24 md:px-8 md:py-32 lg:grid-cols-12 lg:gap-8">
      {/* Two portraits that overlap: the everyday and the editorial side of the same person. */}
      <div className="relative lg:col-span-5">
        <Reveal className="aspect-[4/5] w-[78%] overflow-hidden">
          <Photo frame={8} sizes="(min-width: 1024px) 32vw, 78vw" alt="Mimi with long braids on a campus road, looking over her shoulder" />
        </Reveal>
        <Reveal delay={0.12} className="-mt-[38%] ml-auto aspect-[3/4] w-[52%] overflow-hidden border-8 border-bg">
          <Photo frame={46} sizes="(min-width: 1024px) 22vw, 52vw" alt="Mimi in a garden holding a sprig of leaves above her head, wearing pearls" />
        </Reveal>
      </div>

      <Reveal className="flex flex-col justify-center lg:col-span-6 lg:col-start-7">
        <p className="label mb-6 text-muted">Her story</p>
        <h2 className="display pb-1 text-5xl leading-[1.1] md:text-7xl">Beauty. Confidence. <em>Creativity.</em></h2>
        <div className="mt-8 max-w-[58ch] space-y-5 text-lg leading-relaxed text-muted">
          <p className="text-xl text-ink">Hi, I'm Mimi, a creative storyteller with an eye for the little details that make everyday moments beautiful.</p>
          <p>My world is a celebration of femininity, natural beauty and personal style. From effortless beauty looks to vibrant fashion and culturally inspired styling, I love exploring the many ways we express ourselves.</p>
          <p>Rooted in authenticity, elegance and confidence, I create imagery and stories that invite people to connect.</p>
        </div>
      </Reveal>
    </section>
  )
}
