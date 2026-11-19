// Posters + data file for the "In Motion" reel. Videos are encoded into public/videos/NNN.mp4
// (ffmpeg: muted, 540px wide, H.264) from brand-guide/assets/album-new/NNN.mp4; stills are NNN.jpg there.
import { readdir, writeFile, stat } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const vids = path.join(root, 'public/videos')
const stills = path.join(root, 'brand-guide/assets/album-new')
const files = (await readdir(vids)).filter((f) => f.endsWith('.mp4')).sort()
const out = []
for (const f of files) {
  const id = f.replace('.mp4', '')
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', path.join(vids, f)]).toString())
  const { width, height } = probe.streams[0]
  const still = path.join(stills, `${id}.jpg`)
  // Some clips have no downloaded still: grab a frame from the video instead.
  const input = await stat(still).then(() => still, () => execFileSync('ffmpeg', ['-v', 'error', '-ss', '0.5', '-i', path.join(vids, f), '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], { maxBuffer: 1 << 26 }))
  await sharp(input).rotate().resize({ width: 540 }).webp({ quality: 72 }).toFile(path.join(vids, `${id}.webp`))
  out.push({ id, src: `videos/${f}`, poster: `videos/${id}.webp`, width, height, seconds: Math.round(+probe.format.duration) })
}
await writeFile(path.join(root, 'src/data/videos.json'), JSON.stringify(out, null, 2))
console.log(`videos: ${out.length}`)
