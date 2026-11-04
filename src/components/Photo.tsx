import type { ImgHTMLAttributes, Ref } from 'react'
import { frame as getFrame, type Frame } from '../data/site'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> & {
  frame: number | Frame
  sizes: string
  priority?: boolean
  ref?: Ref<HTMLImageElement>
  alt: string
}

/** Album frame with srcset and intrinsic size, so the layout never shifts while it loads. */
export function Photo({ frame, sizes, priority, className = '', style, alt, ...rest }: Props) {
  const f = typeof frame === 'number' ? getFrame(frame) : frame
  return (
    <img
      src={f.src}
      srcSet={f.srcSet}
      sizes={sizes}
      width={f.width}
      height={f.height}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      draggable={false}
      className={`block h-full w-full object-cover ${className}`}
      style={{ objectPosition: f.position, ...style }}
      {...rest}
    />
  )
}
