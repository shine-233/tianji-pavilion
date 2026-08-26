<script setup lang="ts">
/**
 * 大运山河：十年一步化作连绵山峦，亲和度定山势高低与色泽
 * 互动：拖拽旋转 / 滚轮缩放 / 点击山峰选中该步大运 / 光点沿运途巡回
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { FrameGate, dprCap } from '../lib/perf'
import { sfx } from '../lib/sfx'

export interface VoyageStop {
  gz: string
  window: string
  fin: number
}

const props = defineProps<{ stops: VoyageStop[]; selected?: number | null }>()
const emit = defineEmits<{ select: [i: number] }>()

const container = ref<HTMLDivElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let group: THREE.Group | null = null
let orb: THREE.Mesh | null = null
let orbLight: THREE.PointLight | null = null
let curve: THREE.CatmullRomCurve3 | null = null
let pillars: THREE.Mesh[] = []
let raf = 0
let disposed = false
let gate: FrameGate | null = null

let dragging = false
let lastX = 0
let lastY = 0
let movedPx = 0
let targetRotY = -0.5
let targetRotX = 0.22
let camZ = 15
let camZTarget = 15
let idleTimer: number | null = null
const raycaster = new THREE.Raycaster()
const ndc = new THREE.Vector2()

function finColor(fin: number): number {
  if (fin >= 0.6) return 0x5eead4
  if (fin >= 0.3) return 0xe8c473
  if (fin <= -0.3) return 0xf87171
  return 0xd8c9a8
}

function textSprite(main: string, sub: string, color: string): THREE.Sprite {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 128
  const g = c.getContext('2d')!
  g.textAlign = 'center'
  g.font = '600 56px "Noto Serif SC", serif'
  g.shadowColor = color
  g.shadowBlur = 16
  g.fillStyle = '#f4efe2'
  g.fillText(main.slice(0, 2), 128, 52)
  g.font = '400 30px serif'
  g.shadowBlur = 6
  g.fillStyle = 'rgba(190,200,215,0.9)'
  g.fillText(sub, 128, 100)
  const tex = new THREE.CanvasTexture(c)
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  const sp = new THREE.Sprite(mat)
  sp.scale.set(2.1, 1.05, 1)
  return sp
}

function clearGroup(): void {
  if (!group) return
  group.traverse((o) => {
    if (o instanceof THREE.Sprite) {
      o.material.map?.dispose()
      o.material.dispose()
    }
  })
  pillars.forEach((p) => {
    p.geometry.dispose()
    ;(p.material as THREE.Material).dispose()
  })
  pillars = []
  group.clear()
}

function buildVoyage(): void {
  if (!scene || !group) return
  clearGroup()

  const n = props.stops.length
  const span = Math.max(10, n * 2.1)
  const tops: THREE.Vector3[] = []
  props.stops.forEach((s, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1)
    const x = (t - 0.5) * span
    const z = Math.sin(t * Math.PI * 2.3) * 2.6
    const h = 0.85 + Math.min(1, Math.abs(s.fin)) * 2.7
    const col = finColor(s.fin)
    const geo = new THREE.ConeGeometry(0.62 + Math.abs(s.fin) * 0.35, h, 6)
    const mat = new THREE.MeshStandardMaterial({
      color: col,
      emissive: new THREE.Color(col).multiplyScalar(0.22),
      roughness: 0.55,
      metalness: 0.18,
      flatShading: true,
    })
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, h / 2, z)
    m.userData.stopIndex = i
    group!.add(m)
    pillars.push(m)

    const lab = textSprite(s.gz, s.window, '#' + col.toString(16).padStart(6, '0'))
    lab.position.set(x, h + 0.78, z)
    group!.add(lab)

    /* 山脚光圈 */
    const rg = new THREE.RingGeometry(0.72, 0.92, 26)
    rg.rotateX(-Math.PI / 2)
    const rm = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: props.selected === i ? 0.65 : 0.16 })
    const ring = new THREE.Mesh(rg, rm)
    ring.position.set(x, 0.02, z)
    group!.add(ring)

    tops.push(new THREE.Vector3(x, h + 0.25, z))
  })

  if (tops.length >= 2) {
    curve = new THREE.CatmullRomCurve3(tops, false, 'catmullrom', 0.35)
    const tg = new THREE.TubeGeometry(curve, Math.max(48, n * 12), 0.055, 8, false)
    const tm = new THREE.MeshBasicMaterial({ color: 0xffd76e, transparent: true, opacity: 0.75 })
    group.add(new THREE.Mesh(tg, tm))
  } else {
    curve = null
  }

  /* 地面网格 */
  const grid = new THREE.GridHelper(span + 8, 24, 0x33405a, 0x1d2636)
  ;(grid.material as THREE.Material).transparent = true
  ;(grid.material as THREE.Material).opacity = 0.4
  group.add(grid)

  /* 巡回光点 */
  if (!orb) {
    orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 14, 10),
      new THREE.MeshBasicMaterial({ color: 0xfff0b8 }),
    )
    orbLight = new THREE.PointLight(0xffe08a, 2.2, 5)
    orb.add(orbLight)
    scene.add(orb)
  }
}

function animate(): void {
  if (disposed || !renderer || !scene || !camera || !group) return
  raf = requestAnimationFrame(animate)
  if (!dragging) targetRotY += 0.0012
  group.rotation.y += (targetRotY - group.rotation.y) * 0.09
  group.rotation.x += (targetRotX - group.rotation.x) * 0.09
  camZ += (camZTarget - camZ) * 0.08
  camera.position.set(0, 7.4, camZ)
  camera.lookAt(0, 0.8, 0)

  if (orb && curve) {
    const t = ((performance.now() / 1000) % 9) / 9
    const p = curve.getPointAt(Math.min(0.999, t))
    orb.position.copy(group.localToWorld(p.clone()))
  }

  if (gate?.shouldRender) renderer.render(scene, camera)
}

function onResize(): void {
  const el = container.value
  if (!el || !renderer || !camera) return
  renderer.setSize(el.clientWidth, el.clientHeight)
  camera.aspect = el.clientWidth / el.clientHeight
  camera.updateProjectionMatrix()
}

function onPointerDown(e: PointerEvent): void {
  dragging = true
  movedPx = 0
  lastX = e.clientX
  lastY = e.clientY
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function onPointerMove(e: PointerEvent): void {
  if (!dragging) return
  const dx = e.clientX - lastX
  const dy = e.clientY - lastY
  movedPx += Math.abs(dx) + Math.abs(dy)
  lastX = e.clientX
  lastY = e.clientY
  targetRotY += dx * 0.0058
  targetRotX = Math.max(-0.1, Math.min(0.75, targetRotX + dy * 0.004))
}
function onPointerUp(e: PointerEvent): void {
  if (!dragging) return
  dragging = false
  scheduleIdle()
  if (movedPx < 6) pick(e)
}
function pick(e: PointerEvent): void {
  const el = container.value
  if (!el || !camera) return
  const rect = el.getBoundingClientRect()
  ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
  raycaster.setFromCamera(ndc, camera)
  const hit = raycaster.intersectObjects(pillars, false)[0]
  if (hit) {
    const idx = (hit.object.userData as { stopIndex?: number }).stopIndex ?? null
    if (idx !== null && idx !== undefined) {
      emit('select', idx)
      sfx.pop()
    }
  }
}
function onWheel(e: WheelEvent): void {
  e.preventDefault()
  camZTarget = Math.max(7, Math.min(26, camZTarget + e.deltaY * 0.013))
  scheduleIdle()
}
function scheduleIdle(): void {
  if (idleTimer !== null) window.clearTimeout(idleTimer)
  idleTimer = window.setTimeout(() => {
    targetRotY += Math.PI * 2
  }, 5200)
}

watch(() => [props.stops, props.selected], () => buildVoyage(), { deep: false })

onMounted(() => {
  const el = container.value
  if (!el) return
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(dprCap(2))
  gate = gate ?? new FrameGate(renderer.domElement)
  renderer.setSize(el.clientWidth, el.clientHeight)
  el.appendChild(renderer.domElement)
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x0a0c12, 0.03)
  camera = new THREE.PerspectiveCamera(46, el.clientWidth / el.clientHeight, 0.1, 160)

  scene.add(new THREE.AmbientLight(0xf2ead8, 0.72))
  const key = new THREE.DirectionalLight(0xffeccb, 1.3)
  key.position.set(6, 11, 8)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0x6fb8ff, 0.45)
  rim.position.set(-9, 6, -8)
  scene.add(rim)

  group = new THREE.Group()
  scene.add(group)
  buildVoyage()

  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('pointermove', onPointerMove)
  el.addEventListener('pointerup', onPointerUp)
  el.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('resize', onResize)
  animate()
})

onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(raf)
    gate?.dispose()
  window.removeEventListener('resize', onResize)
  const el = container.value
  if (el) {
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerup', onPointerUp)
    el.removeEventListener('wheel', onWheel)
  }
  if (idleTimer !== null) window.clearTimeout(idleTimer)
  if (orb) {
    orb.geometry.dispose()
    ;(orb.material as THREE.Material).dispose()
    scene?.remove(orb)
    orb = null
    orbLight = null
  }
  clearGroup()
  renderer?.dispose()
  el?.querySelector('canvas')?.remove()
})
</script>

<template>
  <div class="dv-wrap">
    <div ref="container" class="dv-canvas"></div>
    <span class="dv-hint">拖拽环视 · 滚轮推近 · 点山峰看那十年的光景</span>
  </div>
</template>

<style scoped>
.dv-wrap { position: relative; width: 100%; height: 380px; border-radius: 14px; overflow: hidden; border: 1px solid var(--line); background: radial-gradient(120% 90% at 50% 0%, rgba(var(--acc-rgb), 0.06), transparent 60%), #07080d; }
.dv-canvas { position: absolute; inset: 0; cursor: grab; touch-action: none; }
.dv-canvas:active { cursor: grabbing; }
.dv-hint {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.68rem;
  color: var(--dim);
  background: rgba(0, 0, 0, 0.3);
  padding: 3px 12px;
  border-radius: 999px;
  white-space: nowrap;
  pointer-events: none;
}
@media (max-width: 700px) { .dv-wrap { height: 300px; } }
</style>
