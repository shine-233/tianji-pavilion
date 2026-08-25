<script setup lang="ts">
/**
 * 水墨流体背景：紧凑版 GPU 稳定流体（ Jos Stam / PavelDoGreat WebGL-Fluid-Simulation 的 MIT 改造）。
 * 指针划过即晕开一笔墨，随速度场卷曲、扩散、缓散。
 * 浅色主题（宣纸/青瓷/胭脂）出真墨色，深色主题出淡金雾。
 * 不支持半浮点纹理或用户偏好减少动效时自动隐身。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const host = ref<HTMLDivElement | null>(null)

let gl: WebGLRenderingContext | null = null
let raf = 0
let disposed = false
let running = false
let themeObs: MutationObserver | null = null
let dpr = 1
let lastX = -1
let lastY = -1
let idleTimer: number | null = null

const SIM_RES = 96
const DYE_RES = 480
const PRESSURE_ITERS = 14
const CURL = 14
const DT = 0.016

interface Prog {
  prog: WebGLProgram
  uniforms: Record<string, WebGLUniformLocation | null>
}
let progAdvect: Prog | null = null
let progSplat: Prog | null = null
let progCurl: Prog | null = null
let progVort: Prog | null = null
let progDiv: Prog | null = null
let progPressure: Prog | null = null
let progGradSub: Prog | null = null
let progDisplay: Prog | null = null

let quadBuf: WebGLBuffer | null = null

interface FBO {
  tex: WebGLTexture
  fb: WebGLFramebuffer
  w: number
  h: number
  texelX: number
  texelY: number
}
let velocity: FBO[] = []
let dye: FBO[] = []
let pressure: FBO[] = []
let divergenceTex: FBO | null = null
let curlTex: FBO | null = null
let read = 0
let dyeRead = 0

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function compile(type: number, src: string): WebGLShader {
  const glx = gl!
  const s = glx.createShader(type)!
  glx.shaderSource(s, src)
  glx.compileShader(s)
  if (!glx.getShaderParameter(s, glx.COMPILE_STATUS)) {
    throw new Error(glx.getShaderInfoLog(s) || 'shader compile failed')
  }
  return s
}

function makeProg(vs: WebGLShader, fsSrc: string): Prog {
  const glx = gl!
  const p = glx.createProgram()!
  glx.attachShader(p, vs)
  glx.attachShader(p, compile(glx.FRAGMENT_SHADER, fsSrc))
  glx.linkProgram(p)
  if (!glx.getProgramParameter(p, glx.LINK_STATUS)) {
    throw new Error(glx.getProgramInfoLog(p) || 'link failed')
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {}
  const n = glx.getProgramParameter(p, glx.ACTIVE_UNIFORMS) as number
  for (let i = 0; i < n; i++) {
    const name = glx.getActiveUniform(p, i)!.name
    uniforms[name] = glx.getUniformLocation(p, name)
  }
  return { prog: p, uniforms }
}

const BASE_VS = `
precision highp float;
attribute vec2 aPos;
varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
uniform vec2 uTexel;
void main () {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(uTexel.x, 0.0);
  vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y);
  vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FS_ADVECT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uVelocity; uniform sampler2D uSource;
uniform vec2 uTexel; uniform float dt; uniform float dissipation;
void main () {
  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * uTexel;
  vec4 result = texture2D(uSource, coord);
  gl_FragColor = result * exp(-dissipation * dt);
}`
const FS_SPLAT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTarget; uniform float aspect; uniform vec3 color; uniform vec2 point; uniform float radius;
void main () {
  vec2 p = vUv - point; p.x *= aspect;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture2D(uTarget, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}`
const FS_CURL = `
precision highp float;
varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float T = texture2D(uVelocity, vT).x;
  float B = texture2D(uVelocity, vB).x;
  gl_FragColor = vec4(0.5 * ((R - L) - (T - B)), 0.0, 0.0, 1.0);
}`
const FS_VORT = `
precision highp float;
varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt;
void main () {
  float L = texture2D(uCurl, vL).x;
  float R = texture2D(uCurl, vR).x;
  float T = texture2D(uCurl, vT).x;
  float B = texture2D(uCurl, vB).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 vel = texture2D(uVelocity, vUv).xy;
  vel += force * dt;
  vel = min(max(vel, -1000.0), 1000.0);
  gl_FragColor = vec4(vel, 0.0, 1.0);
}`
const FS_DIV = `
precision highp float;
varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float T = texture2D(uVelocity, vT).y;
  float B = texture2D(uVelocity, vB).y;
  gl_FragColor = vec4(0.5 * ((R - L) + (T - B)), 0.0, 0.0, 1.0);
}`
const FS_PRESSURE = `
precision highp float;
varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
uniform sampler2D uPressure; uniform sampler2D uDivergence;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  float div = texture2D(uDivergence, vUv).x;
  gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
}`
const FS_GRADSUB = `
precision highp float;
varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
uniform sampler2D uPressure; uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}`
const FS_DISPLAY = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uDye; uniform float uGain;
void main () {
  vec3 c = texture2D(uDye, vUv).rgb;
  float a = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c, clamp(a * uGain, 0.0, 0.62));
}`

function createFBO(w: number, h: number): FBO {
  const glx = gl!
  const tex = glx.createTexture()!
  glx.activeTexture(glx.TEXTURE0)
  glx.bindTexture(glx.TEXTURE_2D, tex)
  glx.texParameteri(glx.TEXTURE_2D, glx.TEXTURE_MIN_FILTER, glx.LINEAR)
  glx.texParameteri(glx.TEXTURE_2D, glx.TEXTURE_MAG_FILTER, glx.LINEAR)
  glx.texParameteri(glx.TEXTURE_2D, glx.TEXTURE_WRAP_S, glx.CLAMP_TO_EDGE)
  glx.texParameteri(glx.TEXTURE_2D, glx.TEXTURE_WRAP_T, glx.CLAMP_TO_EDGE)
  glx.texImage2D(glx.TEXTURE_2D, 0, glx.RGBA, w, h, 0, glx.RGBA, 0x8d33 /* HALF_FLOAT_OES */, null)
  const fb = glx.createFramebuffer()!
  glx.bindFramebuffer(glx.FRAMEBUFFER, fb)
  glx.framebufferTexture2D(glx.FRAMEBUFFER, glx.COLOR_ATTACHMENT0, glx.TEXTURE_2D, tex, 0)
  glx.clearColor(0, 0, 0, 0)
  glx.clear(glx.COLOR_BUFFER_BIT)
  return { tex, fb, w, h, texelX: 1 / w, texelY: 1 / h }
}

function createDouble(w: number, h: number): FBO[] {
  return [createFBO(w, h), createFBO(w, h)]
}

function useProg(p: Prog, target: FBO | null): void {
  const glx = gl!
  glx.bindFramebuffer(glx.FRAMEBUFFER, target ? target.fb : null)
  glx.viewport(0, 0, target ? target.w : glx.drawingBufferWidth, target ? target.h : glx.drawingBufferHeight)
  glx.useProgram(p.prog)
  glx.bindBuffer(glx.ARRAY_BUFFER, quadBuf)
  const loc = glx.getAttribLocation(p.prog, 'aPos')
  glx.enableVertexAttribArray(loc)
  glx.vertexAttribPointer(loc, 2, glx.FLOAT, false, 0, 0)
}

function setTex(unit: number, tex: WebGLTexture, name: string, p: Prog): void {
  const glx = gl!
  glx.activeTexture(glx.TEXTURE0 + unit)
  glx.bindTexture(glx.TEXTURE_2D, tex)
  glx.uniform1i(p.uniforms[name], unit)
}

function draw(): void {
  gl!.drawArrays(gl!.TRIANGLES, 0, 6)
}

function splat(x: number, y: number, dx: number, dy: number, color: [number, number, number], radius: number): void {
  const glx = gl!
  const aspect = glx.drawingBufferWidth / glx.drawingBufferHeight
  // velocity
  const v = velocity[read]!
  useProg(progSplat!, velocity[1 - read]!)
  setTex(0, v.tex, 'uTarget', progSplat!)
  glx.uniform1f(progSplat!.uniforms['aspect'], aspect)
  glx.uniform2f(progSplat!.uniforms['point'], x, y)
  glx.uniform3f(progSplat!.uniforms['color'], dx, dy, 0)
  glx.uniform1f(progSplat!.uniforms['radius'], radius)
  draw()
  read = 1 - read
  // dye
  const d = dye[dyeRead]!
  useProg(progSplat!, dye[1 - dyeRead]!)
  setTex(0, d.tex, 'uTarget', progSplat!)
  glx.uniform1f(progSplat!.uniforms['aspect'], aspect)
  glx.uniform2f(progSplat!.uniforms['point'], x, y)
  glx.uniform3f(progSplat!.uniforms['color'], color[0], color[1], color[2])
  glx.uniform1f(progSplat!.uniforms['radius'], radius)
  draw()
  dyeRead = 1 - dyeRead
}

function step(): void {
  const glx = gl!
  // curl
  useProg(progCurl!, curlTex)
  setTex(0, velocity[read]!.tex, 'uVelocity', progCurl!)
  draw()
  // vorticity
  useProg(progVort!, velocity[1 - read]!)
  setTex(0, velocity[read]!.tex, 'uVelocity', progVort!)
  setTex(1, curlTex!.tex, 'uCurl', progVort!)
  glx.uniform1f(progVort!.uniforms['curl'], CURL)
  glx.uniform1f(progVort!.uniforms['dt'], DT)
  draw()
  read = 1 - read
  // divergence
  useProg(progDiv!, divergenceTex)
  setTex(0, velocity[read]!.tex, 'uVelocity', progDiv!)
  draw()
  // pressure (clear + jacobi)
  useProg(progPressure!, pressure[0])
  glx.clearColor(0, 0, 0, 0)
  glx.clear(glx.COLOR_BUFFER_BIT)
  for (let i = 0; i < PRESSURE_ITERS; i++) {
    useProg(progPressure!, pressure[1 - (i % 2)])
    setTex(0, pressure[i % 2]!.tex, 'uPressure', progPressure!)
    setTex(1, divergenceTex!.tex, 'uDivergence', progPressure!)
    draw()
  }
  // gradient subtract
  useProg(progGradSub!, velocity[1 - read]!)
  setTex(0, pressure[0]!.tex, 'uPressure', progGradSub!)
  setTex(1, velocity[read]!.tex, 'uVelocity', progGradSub!)
  draw()
  read = 1 - read
  // advect velocity
  useProg(progAdvect!, velocity[1 - read]!)
  setTex(0, velocity[read]!.tex, 'uVelocity', progAdvect!)
  setTex(1, velocity[read]!.tex, 'uSource', progAdvect!)
  const vTexel = [velocity[read]!.texelX, velocity[read]!.texelY]
  glx.uniform2f(progAdvect!.uniforms['uTexel'], vTexel[0]!, vTexel[1]!)
  glx.uniform1f(progAdvect!.uniforms['dt'], DT)
  glx.uniform1f(progAdvect!.uniforms['dissipation'], 0.32)
  draw()
  read = 1 - read
  // advect dye
  useProg(progAdvect!, dye[1 - dyeRead]!)
  setTex(0, velocity[read]!.tex, 'uVelocity', progAdvect!)
  setTex(1, dye[dyeRead]!.tex, 'uSource', progAdvect!)
  glx.uniform2f(progAdvect!.uniforms['uTexel'], vTexel[0]!, vTexel[1]!)
  glx.uniform1f(progAdvect!.uniforms['dt'], DT)
  glx.uniform1f(progAdvect!.uniforms['dissipation'], 0.55)
  draw()
  dyeRead = 1 - dyeRead
}

function frame(): void {
  if (!gl) return
  step()
  useProg(progDisplay!, null)
  setTex(0, dye[dyeRead]!.tex, 'uDye', progDisplay!)
  draw()
  raf = requestAnimationFrame(frame)
}

function inkColor(): [number, number, number] {
  const theme = document.documentElement.dataset.theme || 'zixiao'
  // 浅色主题：真墨；深色主题：淡金雾
  if (theme === 'shuimo') return [0.045, 0.045, 0.055]
  if (theme === 'qingci') return [0.06, 0.1, 0.09]
  if (theme === 'yanzhi') return [0.14, 0.06, 0.09]
  return [0.16, 0.13, 0.07]
}

function onMove(e: PointerEvent): void {
  if (!gl || !host.value) return
  const r = host.value.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width
  const y = 1 - (e.clientY - r.top) / r.height
  if (x < 0 || x > 1 || y < 0 || y > 1) {
    lastX = -1
    return
  }
  if (lastX >= 0) {
    const dx = (x - lastX) * 14
    const dy = (y - lastY) * 14
    const c = inkColor()
    splat(x, y, dx, dy, [c[0]! * 0.5, c[1]! * 0.5, c[2]! * 0.5], 0.0022)
  }
  lastX = x
  lastY = y
  if (idleTimer !== null) window.clearTimeout(idleTimer)
  idleTimer = window.setTimeout(() => (lastX = -1), 120)
}

/** 闲时偶尔自动晕一笔，画面不死寂 */
let ambientTimer: number | null = null
function ambient(): void {
  if (gl && Math.random() < 0.8) {
    const c = inkColor()
    const x = 0.15 + Math.random() * 0.7
    const y = 0.2 + Math.random() * 0.6
    const a = Math.random() * Math.PI * 2
    splat(x, y, Math.cos(a) * 60, Math.sin(a) * 60, [c[0]! * 0.3, c[1]! * 0.3, c[2]! * 0.3], 0.004)
  }
  ambientTimer = window.setTimeout(ambient, 3400 + Math.random() * 2600)
}

function resize(): void {
  const glx = gl
  const el = host.value
  if (!glx || !el) return
  const r = el.getBoundingClientRect()
  dpr = Math.min(window.devicePixelRatio, 1.6)
  const w = Math.max(2, Math.round(r.width * dpr))
  const h = Math.max(2, Math.round(r.height * dpr))
  if (glx.drawingBufferWidth === w && glx.drawingBufferHeight === h) return
  glx.canvas.width = w
  glx.canvas.height = h
  velocity = createDouble(SIM_RES, SIM_RES)
  dye = createDouble(DYE_RES, Math.round((DYE_RES * h) / w))
  pressure = createDouble(SIM_RES, SIM_RES)
  divergenceTex = createFBO(SIM_RES, SIM_RES)
  curlTex = createFBO(SIM_RES, SIM_RES)
  read = 0
  dyeRead = 0
}

function onVis(): void {
  if (disposed) return
  if (document.hidden) {
    cancelAnimationFrame(raf)
    running = false
  } else if (!running && !reducedMotion) {
    running = true
    raf = requestAnimationFrame(frame)
  }
}

onMounted(() => {
  if (reducedMotion) return
  const el = host.value
  const cv = document.createElement('canvas')
  cv.style.position = 'absolute'
  cv.style.inset = '0'
  cv.style.width = '100%'
  cv.style.height = '100%'
  el?.appendChild(cv)
  gl = cv.getContext('webgl', { alpha: true, depth: false, stencil: false, antialias: false, premultipliedAlpha: true })
  if (!gl) return
  if (!gl.getExtension('OES_texture_half_float') || !gl.getExtension('OES_texture_half_float_linear')) {
    gl = null
    return
  }
  try {
    const vs = compile(gl.VERTEX_SHADER, BASE_VS)
    progAdvect = makeProg(vs, FS_ADVECT)
    progSplat = makeProg(vs, FS_SPLAT)
    progCurl = makeProg(vs, FS_CURL)
    progVort = makeProg(vs, FS_VORT)
    progDiv = makeProg(vs, FS_DIV)
    progPressure = makeProg(vs, FS_PRESSURE)
    progGradSub = makeProg(vs, FS_GRADSUB)
    progDisplay = makeProg(vs, FS_DISPLAY)
    quadBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW)
    resize()
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    // 开场一笔
    const c = inkColor()
    splat(0.5, 0.42, 120, -40, [c[0]! * 0.4, c[1]! * 0.4, c[2]! * 0.4], 0.005)
    running = true
    raf = requestAnimationFrame(frame)
    ambientTimer = window.setTimeout(ambient, 2600)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVis)
    themeObs = new MutationObserver(() => { /* 颜色在每次 splat 时实时读取，无需缓存 */ })
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  } catch (e) {
    console.warn('水墨流体初始化失败，已降级:', e)
    gl = null
  }
})

onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(raf)
  if (idleTimer !== null) window.clearTimeout(idleTimer)
  if (ambientTimer !== null) window.clearTimeout(ambientTimer)
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('resize', resize)
  document.removeEventListener('visibilitychange', onVis)
  themeObs?.disconnect()
  host.value?.replaceChildren()
})
</script>

<template>
  <div ref="host" class="ink-fluid" aria-hidden="true"></div>
</template>

<style scoped>
.ink-fluid {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.85;
}
</style>
