import collectionsJson from './collections.json'

export type Frame = { frame: number; width: number; height: number; src: string; srcSet: string; position: string; trim: number }
export type Collection = { slug: string; name: string; line: string; mood: string[]; hero: number; frames: Frame[] }

export const allCollections = collectionsJson as Collection[]
// The first nine are the original chapters (3D journey / bento); the rest follow in a plain grid.
export const collections = allCollections.slice(0, 9)
export const moreCollections = allCollections.slice(9)

const all = new Map(allCollections.flatMap((c) => c.frames.map((f) => [f.frame, f] as const)))
export const frame = (n: number) => {
  const f = all.get(n)
  if (!f) throw new Error(`Unknown album frame ${n}`)
  return f
}

export const links = {
  instagram: 'https://www.instagram.com/idunnuoluwam/',
  tiktok: 'https://www.tiktok.com/@mimi_idunnu',
}

// One label for the contact intent, used by every contact button on the page.
export const CONTACT = 'Work with me'

// The prologue already shows frame 49, so its collection leads with a different frame elsewhere.
const COVER: Record<string, number> = { 'crowned-in-violet': 53 }
export const coverOf = (c: Collection) => c.frames.find((f) => f.frame === COVER[c.slug]) ?? c.frames[0]

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
