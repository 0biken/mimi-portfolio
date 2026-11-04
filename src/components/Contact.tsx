import { Button } from './Button'
import { Reveal } from './Reveal'
import { CONTACT, links } from '../data/site'

export function Contact() {
  return (
    <section id="contact" className="px-4 py-28 text-center md:py-40">
      <Reveal className="mx-auto max-w-4xl">
        <p className="label mb-6 text-muted">Epilogue</p>
        <h2 className="display pb-2 text-6xl leading-[1.1] md:text-8xl">Let's create something <em>beautiful.</em></h2>
        <p className="mx-auto mt-6 max-w-[46ch] text-lg leading-relaxed text-muted">
          For campaigns, creative projects and collaborations, send a message on Instagram.
        </p>
        <div className="mt-10"><Button href={links.instagram} external>{CONTACT}</Button></div>
      </Reveal>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted md:px-8">
        <span>© {new Date().getFullYear()} Mimi Idunnu</span>
        <span className="flex gap-6">
          <a href={links.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-ink">Instagram</a>
          <a href={links.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-ink">TikTok</a>
        </span>
      </div>
    </footer>
  )
}
