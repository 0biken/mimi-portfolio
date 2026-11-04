import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from '@phosphor-icons/react'
import { collections, coverOf, ROMAN, type Collection } from '../data/site'
import { canWebGL, coverGlsl, focusOf, loadTexture, loadThree, noiseGlsl, rgb, textureUrl } from '../gl/gl'
import { CollectionsBento } from './CollectionsBento'

const ease = [0.16, 1, 0.3, 1] as const
const GAP = 6      // world units between chapters along the camera path
const DIST = 4.6   // camera distance from the chapter in focus

/** The nine collections as chapters on one camera path. Falls back to the bento grid without WebGL or with reduced motion. */
export function Journey({ onOpen }: { onOpen: (c: Collection) => void }) {
  const reduce = useReducedMotion()
  const [gl] = useState(() => !reduce && canWebGL())
  return gl ? <JourneyScene onOpen={onOpen} /> : <CollectionsBento onOpen={onOpen} />
}

const vertex = /* glsl */ `
  uniform float uVel, uHover;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    // The page bends like a turning print as the story moves, and lifts toward the pointer on hover.
    p.z += sin(uv.x * 3.14159) * uVel * 0.25 + sin(uv.y * 3.14159) * uHover * 0.06;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uPlane, uImage, uTrim, uAlpha, uFog, uHover, uTime;
  uniform vec2 uFocus;
  uniform vec3 uBg;
  varying vec2 vUv;
  ${coverGlsl}
  ${noiseGlsl}
  void main() {
    vec2 uv = (vUv - 0.5) / (1.0 + uHover * 0.04) + 0.5;
    vec3 col = texture2D(uTex, coverUv(uv, uPlane, uImage, uFocus, uTrim)).rgb;
    col *= 1.0 + uHover * 0.06;
    col = mix(col, uBg, uFog);
    col += (hash(vUv * 900.0 + fract(uTime)) - 0.5) * 0.025;
    gl_FragColor = vec4(col, uAlpha);
  }
`

type Layout = { x: number; y: number; z: number; ry: number; h: number }

function layout(i: number, aspect: number, mobile: boolean, viewAspect: number): Layout {
  if (mobile) {
    const visW = 2 * DIST * Math.tan((35 / 2) * (Math.PI / 180)) * viewAspect
    return { x: 0, y: 0.46, z: -i * GAP, ry: 0, h: Math.min(1.5, (visW * 0.82) / aspect) }
  }
  const odd = i % 2 === 1
  return { x: odd ? 1.1 : 0.9, y: odd ? -0.06 : 0.08, z: -i * GAP, ry: odd ? -0.14 : -0.06, h: 2.1 }
}

const smooth = (a: number, b: number, x: number) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t) }

function JourneyScene({ onOpen }: { onOpen: (c: Collection) => void }) {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const blocks = useRef<(HTMLElement | null)[]>([])
  const [active, setActive] = useState(-1)
  const open = useRef(onOpen)
  open.current = onOpen

  useEffect(() => {
    const el = host.current!, sec = section.current!
    let disposed = false
    let cleanup = () => {}

    ;(async () => {
      const THREE = await loadThree()
      if (disposed) return
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      renderer.domElement.className = 'absolute inset-0 h-full w-full'
      el.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60)
      const geometry = new THREE.PlaneGeometry(1, 1, 32, 32)
      const bg = rgb(THREE, '#1E0F24')
      const small = innerWidth < 768

      const planes = collections.map((c) => {
        const f = coverOf(c)
        const aspect = f.width / (f.height * (1 - f.trim))
        const uniforms = {
          uTex: { value: null as InstanceType<typeof THREE.Texture> | null },
          uPlane: { value: aspect }, uImage: { value: f.width / f.height }, uTrim: { value: f.trim },
          uFocus: { value: new THREE.Vector2(...focusOf(f)) },
          uAlpha: { value: 0 }, uFog: { value: 0 }, uHover: { value: 0 }, uVel: { value: 0 }, uTime: { value: 0 }, uBg: { value: bg },
        }
        const material = new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.visible = false
        scene.add(mesh)
        const plane = { c, aspect, mesh, uniforms, loaded: 0, hover: 0, base: { x: 0, y: 0 } }
        // Chapters load in story order so the first ones arrive first.
        return plane
      })
      ;(async () => {
        for (const p of planes) {
          const tex = await loadTexture(THREE, textureUrl(coverOf(p.c), small))
          if (disposed) { tex.dispose(); return }
          p.uniforms.uTex.value = tex
          p.mesh.visible = true
        }
      })()

      let mobile = false
      const place = () => {
        const { width, height } = el.getBoundingClientRect()
        mobile = width < 768
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        planes.forEach((p, i) => {
          const l = layout(i, p.aspect, mobile, width / height)
          p.mesh.position.set(l.x, l.y, l.z)
          p.base = { x: l.x, y: l.y }
          p.mesh.rotation.y = l.ry
          p.mesh.scale.set(l.h * p.aspect, l.h, 1)
        })
      }
      const ro = new ResizeObserver(place)
      ro.observe(el)
      place()

      // Pointer: a little camera drift, plus hover and click on the chapter in focus.
      const ray = new THREE.Raycaster()
      const ndc = new THREE.Vector2(9, 9)
      const drift = new THREE.Vector2()
      const rest = new THREE.Vector2()
      let hovered: (typeof planes)[number] | null = null
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      }
      const onLeave = () => ndc.set(9, 9)
      const onClick = () => { if (hovered) open.current(hovered.c) }
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerdown', onMove)
      el.addEventListener('pointerleave', onLeave)
      el.addEventListener('click', onClick)

      let visible = false
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { rootMargin: '100px' })
      io.observe(sec)

      let p = -1, travel = -1, vel = 0, last = performance.now(), shown = -2
      renderer.setAnimationLoop((now) => {
        const dt = Math.min((now - last) / 1000, 0.05)
        last = now
        if (!visible) return
        const k = 1 - Math.exp(-dt * 4.5)

        // Scroll position in "chapters": -1 is the intro, 0..8 the chapters.
        const vh = innerHeight
        const target = Math.min(Math.max(-sec.getBoundingClientRect().top / vh - 1, -1), planes.length - 1)
        p += (target - p) * k
        // Each chapter gets a beat: the camera holds while its text is on screen, then travels to the next.
        const base = Math.floor(p)
        const beat = base + smooth(0.22, 0.78, p - base)
        vel += ((beat - travel) / Math.max(dt, 1e-3) - vel) * k
        travel = beat
        const idx = p < -0.5 ? -1 : Math.round(p)
        if (idx !== shown) { shown = idx; setActive(idx) }

        drift.lerp(ndc.x > 2 ? rest : ndc, k * 0.5)
        camera.position.set(drift.x * 0.12, drift.y * 0.08, -travel * GAP + DIST)
        camera.lookAt(drift.x * 0.04, 0, camera.position.z - DIST)

        ray.setFromCamera(ndc, camera)
        const hit = ray.intersectObjects(planes.filter((q) => q.mesh.visible && q.uniforms.uAlpha.value > 0.6).map((q) => q.mesh))[0]
        hovered = ndc.x > 2 ? null : planes.find((q) => q.mesh === hit?.object) ?? null
        el.style.cursor = hovered ? 'pointer' : ''

        planes.forEach((q) => {
          const d = camera.position.z - q.mesh.position.z
          q.loaded += ((q.uniforms.uTex.value ? 1 : 0) - q.loaded) * k
          q.hover += ((q === hovered ? 1 : 0) - q.hover) * k * 1.5
          // Once the camera passes a chapter, that frame drifts aside and dissolves instead of filling the screen.
          const past = Math.max(DIST - d, 0)
          q.mesh.position.x = q.base.x + past * (mobile ? 0 : 0.55)
          q.mesh.position.y = q.base.y + past * (mobile ? 0.45 : 0.08)
          q.uniforms.uAlpha.value = smooth(2.3, 4.0, d) * (1 - smooth(13, 19, d)) * q.loaded
          q.uniforms.uFog.value = smooth(DIST + 0.5, 16, d) * 0.85
          q.uniforms.uHover.value = q.hover
          q.uniforms.uVel.value = Math.max(Math.min(vel, 2), -2)
          q.uniforms.uTime.value = now / 1000
        })
        renderer.render(scene, camera)
      })

      cleanup = () => {
        renderer.setAnimationLoop(null)
        ro.disconnect(); io.disconnect()
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerdown', onMove)
        el.removeEventListener('pointerleave', onLeave)
        el.removeEventListener('click', onClick)
        planes.forEach((q) => { q.uniforms.uTex.value?.dispose(); (q.mesh.material as InstanceType<typeof THREE.ShaderMaterial>).dispose() })
        geometry.dispose(); renderer.dispose(); renderer.domElement.remove()
      }
    })()

    return () => { disposed = true; cleanup() }
  }, [])

  const goTo = (i: number) => blocks.current[i + 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const n = collections.length

  return (
    <section id="collections" ref={section} data-scene="dark" aria-labelledby="chapters-title" className="scene-dark relative bg-bg">
      <div ref={stage} className="sticky top-0 h-[100dvh] overflow-hidden">
        <div ref={host} aria-hidden className="absolute inset-0" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-linear-to-t from-bg via-bg/85 to-transparent md:hidden" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 hidden w-[45%] bg-linear-to-r from-bg/80 to-transparent md:block" />

        {/* Chapter rail: where you are in the story, and a way to jump. */}
        <nav aria-label="Chapters" className={`absolute bottom-8 right-4 z-10 hidden items-center gap-5 transition-opacity duration-500 md:right-8 lg:flex ${active < 0 ? 'opacity-0' : 'opacity-100'}`}>
          <span className="label tabular-nums text-muted">{ROMAN[Math.max(active, 0)]} / {ROMAN[n - 1]}</span>
          <span className="flex gap-1.5">
            {collections.map((c, i) => (
              <button key={c.slug} type="button" onClick={() => goTo(i)} aria-label={`Chapter ${ROMAN[i]}: ${c.name}`}
                      aria-current={i === active ? 'step' : undefined} tabIndex={active < 0 ? -1 : 0}
                      className="group py-3">
                <span className={`block h-px transition-[width,background-color] duration-500 ease-out-strong ${i === active ? 'w-10 bg-accent' : 'w-4 bg-line group-hover:bg-muted'}`} />
              </button>
            ))}
          </span>
        </nav>
      </div>

      <div className="relative -mt-[100dvh]">
        <Block refFn={(e) => (blocks.current[0] = e)}>
          <p className="label text-accent">Nine chapters</p>
          <h2 id="chapters-title" className="display mt-5 pb-1 text-5xl leading-[1.05] md:text-7xl">A story told <em>in frames.</em></h2>
          <p className="mt-6 max-w-[38ch] text-lg leading-relaxed text-muted">
            From studio to street, every collection is a chapter. Keep scrolling to walk through them, or open one to see every frame.
          </p>
        </Block>
        {collections.map((c, i) => (
          <Block key={c.slug} refFn={(e) => (blocks.current[i + 1] = e)}>
            <p className="label text-accent">Chapter {ROMAN[i]}</p>
            <h3 className="display mt-5 pb-1 text-5xl leading-[1.05] md:text-7xl">{c.name}</h3>
            <p className="display mt-4 max-w-[30ch] text-xl italic leading-snug text-muted md:text-2xl">{c.line}</p>
            <p className="mt-4 text-sm text-muted">{c.mood.join(' / ')}</p>
            <button type="button" onClick={() => onOpen(c)}
                    className="mt-8 inline-flex items-center gap-3 whitespace-nowrap bg-ink px-6 py-3.5 text-sm font-medium text-on-ink transition-[transform,background-color] duration-150 ease-out hover:bg-muted active:scale-[0.97]">
              Open the chapter <span className="text-on-ink/70">{c.frames.length} photos</span>
              <ArrowUpRight size={16} aria-hidden />
            </button>
          </Block>
        ))}
      </div>
    </section>
  )
}

function Block({ children, refFn }: { children: ReactNode; refFn: (e: HTMLElement | null) => void }) {
  const reduce = useReducedMotion()
  return (
    <article ref={refFn} className="pointer-events-none mx-auto flex min-h-[100dvh] max-w-[1400px] items-end px-4 pb-16 md:px-8 lg:items-center lg:pb-0">
      <motion.div className="pointer-events-auto max-w-[36rem] lg:max-w-[40%]"
                  initial={{ opacity: 0, y: reduce ? 0 : 32 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ amount: 0.3 }} transition={{ duration: 0.9, ease }}>
        {children}
      </motion.div>
    </article>
  )
}
