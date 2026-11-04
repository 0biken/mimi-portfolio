import { useEffect, useRef, type RefObject } from 'react'
import { frame as getFrame } from '../data/site'
import { coverGlsl, focusOf, loadThree, noiseGlsl, rgb } from '../gl/gl'

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

const fragment = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uPlane, uImage, uTrim, uProgress, uScroll, uTime, uHover;
  uniform vec2 uFocus, uMouse, uRes;
  uniform vec3 uBg, uAccent;
  varying vec2 vUv;
  ${coverGlsl}
  ${noiseGlsl}
  void main() {
    vec2 uv = vUv;
    // A soft lens follows the pointer.
    vec2 d = uv - uMouse; d.x *= uPlane;
    uv -= (uv - uMouse) * exp(-dot(d, d) * 14.0) * 0.05 * uHover;
    // Settles from a slight zoom as it appears, then pushes in as the prologue scrolls away.
    float zoom = 1.0 + (1.0 - uProgress) * 0.08 + uScroll * 0.12;
    uv = (uv - vec2(0.5, 0.4)) / zoom + vec2(0.5, 0.4);
    vec3 col = texture2D(uTex, coverUv(uv, uPlane, uImage, uFocus, uTrim)).rgb;

    // Reveal: the photo rises out of the plum through a slow noise field, with a thin fuchsia edge.
    float n = fbm(vUv * vec2(uPlane * 3.0, 3.0) + uTime * 0.04);
    float edge = vUv.y * 0.7 + n * 0.3;
    float p = uProgress * 1.12;
    float mask = smoothstep(edge - 0.05, edge + 0.01, p);
    float rim = smoothstep(0.035, 0.0, abs(p - edge)) * (1.0 - smoothstep(0.85, 1.0, uProgress));
    col = mix(uBg, col, mask) + uAccent * rim * 0.55;

    col *= 1.0 - uScroll * 0.45;
    col += (hash(vUv * uRes + fract(uTime)) - 0.5) * 0.03; // film grain
    gl_FragColor = vec4(col, 1.0);
  }
`

/** The prologue portrait drawn in WebGL: a noise reveal on load, a pointer lens and a scroll push-in. */
export function HeroCanvas({ frame, image, onReady }: { frame: number; image: RefObject<HTMLImageElement | null>; onReady: () => void }) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = host.current!
    let disposed = false
    let cleanup = () => {}

    ;(async () => {
      const THREE = await loadThree()
      const f = getFrame(frame)
      // Reuse the <img> the browser already picked from the srcset, so the portrait downloads once.
      const img = image.current!
      await img.decode().catch(() => {})
      if (disposed || !img.naturalWidth) return
      // An ImageBitmap has exact pixel dimensions (an <img> reports its layout size), so the upload always fits.
      const bitmap = await createImageBitmap(img, { imageOrientation: 'flipY' })
      if (disposed) return bitmap.close()
      const tex = new THREE.Texture(bitmap)
      tex.flipY = false
      tex.colorSpace = THREE.NoColorSpace
      tex.minFilter = THREE.LinearFilter
      tex.generateMipmaps = false
      tex.needsUpdate = true

      const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      renderer.domElement.className = 'absolute inset-0 h-full w-full'
      el.appendChild(renderer.domElement)

      const uniforms = {
        uTex: { value: tex }, uPlane: { value: 1 }, uImage: { value: f.width / f.height },
        uTrim: { value: f.trim }, uFocus: { value: new THREE.Vector2(...focusOf(f)) },
        uProgress: { value: 0 }, uScroll: { value: 0 }, uTime: { value: 0 }, uHover: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) }, uRes: { value: new THREE.Vector2(1, 1) },
        uBg: { value: rgb(THREE, '#1E0F24') }, uAccent: { value: rgb(THREE, '#F0609E') },
      }
      const material = new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment })
      const geometry = new THREE.PlaneGeometry(2, 2)
      const scene = new THREE.Scene()
      scene.add(new THREE.Mesh(geometry, material))
      const camera = new THREE.Camera()

      const resize = () => {
        const { width, height } = el.getBoundingClientRect()
        renderer.setSize(width, height, false)
        uniforms.uPlane.value = width / height
        uniforms.uRes.value.set(width, height)
      }
      const ro = new ResizeObserver(resize)
      ro.observe(el)
      resize()

      const mouse = new THREE.Vector2(0.5, 0.5)
      let hover = 0
      const section = el.closest('section') ?? el
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return
        const r = el.getBoundingClientRect()
        mouse.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height)
        hover = 1
      }
      const onLeave = () => { hover = 0 }
      section.addEventListener('pointermove', onMove as EventListener)
      section.addEventListener('pointerleave', onLeave)

      let visible = true
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
      io.observe(el)

      const start = performance.now()
      let last = start
      let first = true
      renderer.setAnimationLoop((now) => {
        const dt = Math.min((now - last) / 1000, 0.05)
        last = now
        if (!visible) return
        const t = (now - start) / 1000
        const k = 1 - Math.exp(-dt * 5)
        // 2.2 s ease-in-out reveal.
        const x = Math.min(t / 2.2, 1)
        uniforms.uProgress.value = x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
        uniforms.uTime.value = t
        uniforms.uMouse.value.lerp(mouse, k)
        uniforms.uHover.value += (hover - uniforms.uHover.value) * k
        const r = section.getBoundingClientRect()
        uniforms.uScroll.value = Math.min(Math.max(-r.top / r.height, 0), 1)
        renderer.render(scene, camera)
        if (first) { first = false; onReady() }
      })

      cleanup = () => {
        renderer.setAnimationLoop(null)
        ro.disconnect(); io.disconnect()
        section.removeEventListener('pointermove', onMove as EventListener)
        section.removeEventListener('pointerleave', onLeave)
        geometry.dispose(); material.dispose(); tex.dispose(); renderer.dispose()
        renderer.domElement.remove()
      }
    })()

    return () => { disposed = true; cleanup() }
  }, [frame, image, onReady])

  return <div ref={host} aria-hidden className="absolute inset-0" />
}
