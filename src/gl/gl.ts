// Shared WebGL helpers. three.js is loaded on demand so the first paint never waits for it.
import type { Frame } from '../data/site'

export type Three = typeof import('three')
export const loadThree = () => import('three')

let supported: boolean | undefined
/** True when the browser can create a WebGL2 context. Checked once. */
export function canWebGL() {
  if (supported !== undefined) return supported
  try {
    const c = document.createElement('canvas')
    supported = !!c.getContext('webgl2')
  } catch {
    supported = false
  }
  return supported
}

/** Phones get the 640 px file; everything else the 1280 px one. */
export const textureUrl = (f: Frame, small: boolean) => (small ? f.srcSet.split(' ')[0] : f.src)

export async function loadTexture(THREE: Three, url: string) {
  const tex = await new THREE.TextureLoader().loadAsync(url)
  // Shaders here pass colour straight through (no linear round trip), so the photo keeps its exact tones.
  tex.colorSpace = THREE.NoColorSpace
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.anisotropy = 4
  return tex
}

/**
 * GLSL: maps a plane uv onto a photo like CSS object-fit: cover.
 * uPlane / uImage are width/height ratios, uFocus is the focal point (0-1, y down like CSS),
 * uTrim removes a share of the frame's top edge (the studio signature) before fitting.
 */
export const coverGlsl = /* glsl */ `
  vec2 coverUv(vec2 uv, float plane, float image, vec2 focus, float trim) {
    float img = image / (1.0 - trim);
    vec2 ratio = vec2(min(plane / img, 1.0), min(img / plane, 1.0));
    vec2 f = vec2(focus.x, 1.0 - focus.y);
    vec2 st = uv * ratio + (1.0 - ratio) * f;
    st.y *= (1.0 - trim);
    return st;
  }
`

/** Parses a CSS object-position like "62% 30%" into 0-1 numbers. */
export const focusOf = (f: Frame): [number, number] => {
  const [x, y] = f.position.split(' ').map((v) => parseFloat(v) / 100)
  return [x, y]
}

/** Hex colour to a raw 0-1 vec3, matching the pass-through colour pipeline above. */
export const rgb = (THREE: Three, hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

export const noiseGlsl = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }
`
