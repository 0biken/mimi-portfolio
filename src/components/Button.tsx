import { ArrowUpRight, ArrowDown } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

type Props = { href: string; children: ReactNode; variant?: 'solid' | 'line'; external?: boolean; down?: boolean }

/** Plum fill with cream text (14:1) or an underlined text link. Presses scale to 0.97. */
export function Button({ href, children, variant = 'solid', external, down }: Props) {
  const Icon = down ? ArrowDown : ArrowUpRight
  const base = 'inline-flex items-center gap-3 whitespace-nowrap text-sm font-medium transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.97]'
  const look = variant === 'solid'
    ? 'bg-ink text-on-ink px-6 py-3.5 hover:bg-muted'
    : 'text-ink py-3.5 underline decoration-line underline-offset-8 hover:decoration-accent'
  return (
    <a href={href} className={`${base} ${look}`} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
      <Icon size={16} weight="regular" aria-hidden />
    </a>
  )
}
