// Turn the sorted album into web photos plus a typed data file for the site.
// Source of truth: brand-guide/assets/collections/collections.json (written by organise_album.py).
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const manifest = JSON.parse(await readFile(path.join(root, 'brand-guide/assets/collections/collections.json'), 'utf8'))
const album = path.join(root, 'brand-guide/assets/album')
const out = path.join(root, 'public/photos')
await mkdir(out, { recursive: true })
await mkdir(path.join(root, 'src/data'), { recursive: true })

const WIDTHS = [640, 1280]   // 1280 covers the full-screen lightbox; larger files only add weight
// Studio shoots carry a photographer signature in the top-left corner; bias crops away from it.
const STUDIO = new Set(['crowned-in-violet', 'twin-crowns', 'cobalt-siren'])

const exists = (p) => stat(p).then(() => true, () => false)

async function photo(frame, slug) {
  const src = path.join(album, `${String(frame).padStart(2, '0')}.jpg`)
  const { width, height } = await sharp(src).metadata()
  const widths = WIDTHS.filter((w) => w < width)
  if (width <= WIDTHS.at(-1)) widths.push(width)
  for (const w of widths) {
    const file = path.join(out, `${frame}-${w}.webp`)
    if (!(await exists(file))) await sharp(src).resize({ width: w }).webp({ quality: 74 }).toFile(file)
  }
  return {
    frame, width, height,
    src: `photos/${frame}-${widths.at(-1)}.webp`,
    srcSet: widths.map((w) => `photos/${frame}-${w}.webp ${w}w`).join(', '),
    position: STUDIO.has(slug) ? '62% 30%' : '50% 30%',
    // Share of the frame height to trim from the top in WebGL views (hides the signature).
    trim: STUDIO.has(slug) ? 0.05 : 0,
  }
}

const collections = []
for (const c of manifest) {
  if (c.folder.endsWith('in-motion')) continue
  const slug = c.folder.replace(/^\d+-/, '')
  const frames = await Promise.all(c.files.map((f) => photo(f.frame, slug)))
  const role = Object.fromEntries(c.files.map((f) => [f.frame, f.role]))
  // Gallery order: hero, then picks, then archive frames.
  const rank = { hero: 0, pick: 1, archive: 2 }
  frames.sort((a, b) => rank[role[a.frame]] - rank[role[b.frame]] || a.frame - b.frame)
  collections.push({ slug, name: c.collection, line: c.line, mood: c.mood, hero: frames[0].frame, frames })
}

await writeFile(path.join(root, 'src/data/collections.json'), JSON.stringify(collections, null, 2))
console.log(`photos: ${collections.reduce((n, c) => n + c.frames.length, 0)} frames in ${collections.length} collections`)
