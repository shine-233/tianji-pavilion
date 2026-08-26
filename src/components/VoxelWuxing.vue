<script setup lang="ts">
/**
 * 五行体素天穹：五个体素元素环绕太极台
 * 互动：拖拽旋转 / 滚轮缩放 / 点击聚焦元素 / 闲置自转
 *      相生金色弧线 · 相克赤色虚线 · UnrealBloom 辉光 · 环绕星尘
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { FrameGate, dprCap } from '../lib/perf'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { SHENG_CYCLE, KE_CYCLE, elementVoxels } from '../data/wuxingData'
import { Element, SHENG_ORDER } from '../lib/constants'
import { sfx } from '../lib/sfx'

const props = defineProps<{ counts?: Record<Element, number> | null }>()
const emit = defineEmits<{ select: [e: Element] }>()

const container = ref<HTMLDivElement | null>(null)
const hint = ref(true)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let rootGroup: THREE.Group | null = null
let composer: EffectComposer | null = null
let raf = 0
let disposed = false
let gate: FrameGate | null = null

const GROUPS: Record<string, THREE.Group> = {}
const PICK_MESHES: THREE.InstancedMesh[] = []
const BASE_POS: Record<string, THREE.Vector3> = {}

let dragging = false
let lastX = 0
let lastY = 0
let moved = 0
let targetRotY = 0.4
let targetRotX = 0.16
let idleTimer: number | null = null
let camZ = 17
const raycaster = new THREE.Raycaster()
const pointerNdc = new THREE.Vector2()
let selected: Element | null = null

function taijiTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')!
  const cssVar = (name: string, fallback: string): string => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return v || fallback
  }
  const inkDark = cssVar('--bar', '#232a3a')
  g.fillStyle = '#12151f'
  g.fillRect(0, 0, 512, 512)
  const cx = 256
  const r = 190
  // 外环刻度
  g.strokeStyle = '#3a4258'
  g.lineWidth = 3
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2
    g.beginPath()
    g.moveTo(cx + Math.cos(a) * (r + 12), cx + Math.sin(a) * (r + 12))
    g.lineTo(cx + Math.cos(a) * (r + (i % 8 === 0 ? 34 : 22)), cx + Math.sin(a) * (r + (i % 8 === 0 ? 34 : 22)))
    g.stroke()
  }
  // 太极
  g.fillStyle = '#e9e4d5'
  g.beginPath(); g.arc(cx, cx, r, Math.PI / 2, Math.PI * 1.5); g.fill()
  g.fillStyle = inkDark
  g.beginPath(); g.arc(cx, cx, r, Math.PI / 2 * 3, Math.PI / 2); g.fill()
  g.fillStyle = '#e9e4d5'
  g.beginPath(); g.arc(cx, cx - r / 2, r / 2, 0, Math.PI * 2); g.fill()
  g.fillStyle = inkDark
  g.beginPath(); g.arc(cx, cx + r / 2, r / 2, 0, Math.PI * 2); g.fill()
  g.fillStyle = '#e8c473'
  g.beginPath(); g.arc(cx, cx - r / 2, 18, 0, Math.PI * 2); g.fill()
  g.fillStyle = '#e9e4d5'
  g.beginPath(); g.arc(cx, cx + r / 2, 18, 0, Math.PI * 2); g.fill()
  const tex = new THREE.CanvasTexture(c)
  tex.anisotropy = 4
  return tex
}

function buildElement(e: Element): void {
  const voxels = elementVoxels(e)
  const depth = 3
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.52, 0.52, 0.52),
    new THREE.MeshLambertMaterial(),
    voxels.length * depth,
  )
  const m = new THREE.Matrix4()
  const color = new THREE.Color()
  let idx = 0
  for (let z = 0; z < depth; z++) {
    voxels.forEach((v) => {
      m.setPosition((v.x - 6) * 0.56, (10 - v.y) * 0.56, (z - (depth - 1) / 2) * 0.58)
      mesh.setMatrixAt(idx, m)
      const base = new THREE.Color(v.color)
      const shade = z === 0 ? 0.72 : z === depth - 1 ? 1 : 0.86
      color.copy(base).multiplyScalar(shade)
      mesh.setColorAt(idx, color)
      idx++
    })
  }
  mesh.userData.element = e
  PICK_MESHES.push(mesh)

  const grp = new THREE.Group()
  grp.add(mesh)
  const ang = (SHENG_ORDER.indexOf(e) / 5) * Math.PI * 2 - Math.PI / 2
  const pos = new THREE.Vector3(Math.cos(ang) * 6.2, 2.6, Math.sin(ang) * 6.2)
  grp.position.copy(pos)
  BASE_POS[e] = pos.clone()
  GROUPS[e] = grp
  rootGroup!.add(grp)

  // 底座光环
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(1.7, 2.05, 40),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(elementGlow(e)), transparent: true, opacity: 0.28, side: THREE.DoubleSide }),
  )
  halo.rotation.x = -Math.PI / 2
  halo.position.y = -2.35
  grp.add(halo)
}

function elementGlow(e: Element): string {
  return { 木: '#7bc47f', 火: '#ef7d57', 土: '#c9a15f', 金: '#d8dde6', 水: '#64a7e8' }[e]!
}

function build(): void {
  const el = container.value
  if (!el) return
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(el.clientWidth, el.clientHeight)
  renderer.setPixelRatio(dprCap(2))
  gate = gate ?? new FrameGate(renderer.domElement)
  el.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x0b0d12, 24, 46)
  camera = new THREE.PerspectiveCamera(48, el.clientWidth / el.clientHeight, 0.1, 120)
  camera.position.set(0, 7.5, camZ)
  camera.lookAt(0, 1.6, 0)

  scene.add(new THREE.AmbientLight(0x8899bb, 0.65))
  const key = new THREE.DirectionalLight(0xffe3a8, 1.15)
  key.position.set(6, 14, 8)
  scene.add(key)
  const rim = new THREE.PointLight(0x5eead4, 0.7, 30)
  rim.position.set(-8, 5, -6)
  scene.add(rim)

  rootGroup = new THREE.Group()
  scene.add(rootGroup)

  // 太极台
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 9.4, 0.7, 64), [
    new THREE.MeshLambertMaterial({ map: taijiTexture() }),
    new THREE.MeshLambertMaterial({ color: 0x1a2030 }),
  ])
  disc.position.y = -2.7
  rootGroup.add(disc)

  SHENG_ORDER.forEach(buildElement)

  // 相生弧线
  SHENG_CYCLE.forEach(([a, b]) => addArc(a, b))
  // 相克虚线
  KE_CYCLE.forEach(([a, b]) => addKe(a, b))

  // 星尘
  const starGeo = new THREE.BufferGeometry()
  const N = 700
  const arr = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 70
    arr[i * 3 + 1] = Math.random() * 34 - 6
    arr[i * 3 + 2] = (Math.random() - 0.5) * 70
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3))
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xcfd8ea, size: 0.09, transparent: true, opacity: 0.75 }))
  scene.add(stars)

  // 月轮
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0xf3ecd8 }))
  moon.position.set(-13, 11, -16)
  scene.add(moon)
  const haloM = new THREE.Mesh(new THREE.SphereGeometry(2.1, 32, 32), new THREE.MeshBasicMaterial({ color: 0xf3ecd8, transparent: true, opacity: 0.14 }))
  haloM.position.copy(moon.position)
  scene.add(haloM)

  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(el.clientWidth, el.clientHeight), 0.62, 0.5, 0.72)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  bindEvents()
  tick()
}

function arcMid(a: THREE.Vector3, b: THREE.Vector3, lift: number): THREE.Vector3 {
  return a.clone().add(b).multiplyScalar(0.5).add(new THREE.Vector3(0, lift, 0))
}

function addArc(a: Element, b: Element): void {
  const pa = BASE_POS[a]!.clone().add(new THREE.Vector3(0, 1.4, 0))
  const pb = BASE_POS[b]!.clone().add(new THREE.Vector3(0, 1.4, 0))
  const curve = new THREE.CatmullRomCurve3([pa, arcMid(pa, pb, 3.4), pb])
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 36, 0.055, 8, false),
    new THREE.MeshBasicMaterial({ color: 0xe8c473, transparent: true, opacity: 0.85 }),
  )
  tube.userData.flow = true
  rootGroup!.add(tube)
}

function addKe(a: Element, b: Element): void {
  const pa = BASE_POS[a]!.clone().setY(0.4)
  const pb = BASE_POS[b]!.clone().setY(0.4)
  const geo = new THREE.BufferGeometry().setFromPoints([pa, pb])
  const line = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: 0xf87171, dashSize: 0.28, gapSize: 0.22, transparent: true, opacity: 0.5 }))
  line.computeLineDistances()
  rootGroup!.add(line)
}

function bindEvents(): void {
  const dom = renderer!.domElement
  // 双指捏合缩放
  const activePtrs = new Map<number, { x: number; y: number }>()
  let pinchStartDist = 0
  let pinchStartZ = 0
  const ptrDist = (): number => {
    const [a, b] = [...activePtrs.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }
  const onDown = (ev: PointerEvent): void => {
    activePtrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
    if (activePtrs.size === 2) {
      dragging = false
      pinchStartDist = ptrDist()
      pinchStartZ = camZ
      wake()
      return
    }
    dragging = true
    moved = 0
    lastX = ev.clientX
    lastY = ev.clientY
    dom.setPointerCapture(ev.pointerId)
    wake()
  }
  const onMove = (ev: PointerEvent): void => {
    if (activePtrs.has(ev.pointerId)) activePtrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
    if (activePtrs.size >= 2) {
      const d = ptrDist()
      if (pinchStartDist > 0 && d > 0) {
        camZ = Math.max(9, Math.min(27, (pinchStartZ * pinchStartDist) / d))
        wake()
      }
      return
    }
    if (!dragging) return
    const dx = ev.clientX - lastX
    const dy = ev.clientY - lastY
    moved += Math.abs(dx) + Math.abs(dy)
    lastX = ev.clientX
    lastY = ev.clientY
    targetRotY += dx * 0.007
    targetRotX = Math.max(-0.5, Math.min(0.85, targetRotX + dy * 0.005))
    wake()
  }
  const onUp = (ev: PointerEvent): void => {
    activePtrs.delete(ev.pointerId)
    if (activePtrs.size === 1) {
      const [rest] = [...activePtrs.values()]
      if (rest) {
        lastX = rest.x
        lastY = rest.y
      }
      dragging = true
      moved = 99 // 捏合结束不触发拾取
      return
    }
    if (activePtrs.size > 0) return
    dragging = false
    try { dom.releasePointerCapture(ev.pointerId) } catch { /* noop */ }
    if (moved < 6) pick(ev)
  }
  const onWheel = (ev: WheelEvent): void => {
    ev.preventDefault()
    camZ = Math.max(9, Math.min(27, camZ + ev.deltaY * 0.012))
    wake()
  }
  dom.addEventListener('pointerdown', onDown)
  dom.addEventListener('pointermove', onMove)
  dom.addEventListener('pointerup', onUp)
  dom.addEventListener('wheel', onWheel, { passive: false })

  cleanupFns.push(() => {
    dom.removeEventListener('pointerdown', onDown)
    dom.removeEventListener('pointermove', onMove)
    dom.removeEventListener('pointerup', onUp)
    dom.removeEventListener('wheel', onWheel)
  })
}

const cleanupFns: Array<() => void> = []

function pick(ev: PointerEvent): void {
  const rect = renderer!.domElement.getBoundingClientRect()
  pointerNdc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
  pointerNdc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointerNdc, camera!)
  const hits = raycaster.intersectObjects(PICK_MESHES, false)
  if (hits.length && hits[0]!.object.userData.element) {
    const e = hits[0]!.object.userData.element as Element
    selected = selected === e ? null : e
    emit('select', e)
    sfx.pop()
    hint.value = false
    if (selected) {
      focusOn(selected)
    } else {
      camZ = 17
      wake()
    }
  }
}

/** 镜头聚焦：把选中元素转到镜头正前方并拉近，选中期间暂停自转 */
function focusOn(e: Element): void {
  const baseAng = (SHENG_ORDER.indexOf(e) / 5) * Math.PI * 2 - Math.PI / 2
  const want = Math.PI / 2 - baseAng
  let delta = (want - targetRotY) % (Math.PI * 2)
  if (delta > Math.PI) delta -= Math.PI * 2
  if (delta < -Math.PI) delta += Math.PI * 2
  targetRotY += delta
  targetRotX = 0.14
  camZ = Math.max(12.5, camZ - 3.5)
  wake()
}

function wake(): void {
  hint.value = false
  if (idleTimer !== null) window.clearTimeout(idleTimer)
  idleTimer = window.setTimeout(() => (idleTimer = null), 2600)
}

const clock = new THREE.Clock()

/** 爆裂粒子：小方块从元素位置向外飞散，受重力下坠后消散 */
interface Burst { meshes: THREE.Mesh[]; vels: THREE.Vector3[]; born: number }
const BURSTS: Burst[] = []
const burstGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14)

function triggerBurst(e: Element): void {
  const grp = GROUPS[e]
  if (!grp || !scene) return
  const origin = new THREE.Vector3()
  grp.getWorldPosition(origin)
  origin.y += 0.6
  const color = new THREE.Color(elementGlow(e))
  const meshes: THREE.Mesh[] = []
  const vels: THREE.Vector3[] = []
  for (let i = 0; i < 42; i++) {
    const m = new THREE.Mesh(burstGeo, new THREE.MeshBasicMaterial({ color, transparent: true }))
    m.position.copy(origin)
    const a = Math.random() * Math.PI * 2
    const speed = 2.2 + Math.random() * 4.2
    vels.push(new THREE.Vector3(Math.cos(a) * speed, 2.5 + Math.random() * 4.5, Math.sin(a) * speed))
    m.scale.setScalar(0.7 + Math.random() * 1.1)
    scene.add(m)
    meshes.push(m)
  }
  BURSTS.push({ meshes, vels, born: performance.now() })
  sfx.pop()
  wake()
}

function stepBursts(dtRaw: number): void {
  const now = performance.now()
  for (let bi = BURSTS.length - 1; bi >= 0; bi--) {
    const b = BURSTS[bi]!
    const age = (now - b.born) / 1400
    if (age >= 1) {
      b.meshes.forEach((m) => {
        scene?.remove(m)
        ;(m.material as THREE.Material).dispose()
      })
      BURSTS.splice(bi, 1)
      continue
    }
    const dt = Math.min(dtRaw, 0.05) + 0.0001
    b.meshes.forEach((m, mi) => {
      const v = b.vels[mi]!
      v.y -= 7.5 * dt * 8
      m.position.addScaledVector(v, dt)
      ;(m.material as THREE.MeshBasicMaterial).opacity = 1 - age
      m.rotation.x += dt * 5
      m.rotation.z += dt * 4
    })
  }
}

function tick(): void {
  if (disposed) return
  raf = requestAnimationFrame(tick)
  const dt = clock.getDelta()
  const t = clock.elapsedTime

  stepBursts(dt)

  if (!dragging && idleTimer === null && !selected && rootGroup) targetRotY += dt * 0.12
  if (rootGroup) {
    rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.09
    rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.09
  }
  SHENG_ORDER.forEach((e, i) => {
    const grp = GROUPS[e]
    if (!grp) return
    grp.position.y = BASE_POS[e]!.y + Math.sin(t * 1.4 + i * 1.25) * 0.22
    const cnt = props.counts?.[e] ?? null
    const targetScale = cnt === null ? 1 : 0.72 + Math.min(cnt, 4) * 0.13
    const selBoost = selected === e ? 1.16 : selected ? 0.94 : 1
    const cur = grp.scale.x + (targetScale * selBoost - grp.scale.x) * 0.08
    grp.scale.setScalar(cur)
    grp.rotation.y = Math.sin(t * 0.5 + i) * 0.14
  })
  rootGroup?.children.forEach((ch) => {
    if ((ch as THREE.Mesh).userData?.flow) {
      const mat = (ch as THREE.Mesh).material as THREE.MeshBasicMaterial
      mat.opacity = 0.55 + Math.sin(t * 2.4) * 0.3
    }
  })
  if (camera) {
    camera.position.z += (camZ - camera.position.z) * 0.07
    camera.lookAt(0, 1.4, 0)
  }
  if (gate?.shouldRender) composer?.render()
}

function onResize(): void {
  const el = container.value
  if (!el || !renderer || !camera || !composer) return
  renderer.setSize(el.clientWidth, el.clientHeight)
  composer.setSize(el.clientWidth, el.clientHeight)
  camera.aspect = el.clientWidth / el.clientHeight
  camera.updateProjectionMatrix()
}

onMounted(() => {
  build()
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(raf)
    gate?.dispose()
  window.removeEventListener('resize', onResize)
  cleanupFns.forEach((f) => f())
  renderer?.dispose()
  renderer?.domElement.remove()
})

defineExpose({
  clearSelect: () => (selected = null),
  triggerBurst,
  selectExternal: (e: Element) => {
    selected = e
    hint.value = false
    wake()
    focusOn(e)
  },
})
</script>

<template>
  <div class="vx-wrap">
    <div ref="container" class="vx-canvas"></div>
    <transition name="fadeh">
      <div v-if="hint" class="hint">🖱 拖拽旋转 · 滚轮缩放 · 点击元素查看生克</div>
    </transition>
    <div class="legend">
      <span class="lg"><i class="ln gold"></i>相生弧线</span>
      <span class="lg"><i class="ln red"></i>相克虚线</span>
    </div>
  </div>
</template>

<style scoped>
.vx-wrap { position: relative; border-radius: 14px; overflow: hidden; border: 1px solid var(--line); background: radial-gradient(900px 500px at 50% 20%, rgba(232, 196, 115, 0.05), transparent 60%), #0b0d12; }
.vx-canvas { width: 100%; height: 520px; cursor: grab; touch-action: none; }
.vx-canvas:active { cursor: grabbing; }
.hint {
  position: absolute;
  left: 50%; bottom: 18px;
  transform: translateX(-50%);
  background: rgba(11, 13, 18, 0.75);
  border: 1px solid var(--line);
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 0.78rem;
  color: var(--dim);
  backdrop-filter: blur(6px);
}
.fadeh-leave-active { transition: all 0.5s ease; }
.fadeh-leave-to { opacity: 0; transform: translate(-50%, 10px); }
.legend { position: absolute; right: 12px; top: 10px; display: flex; flex-direction: column; gap: 5px; }
.lg { display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; color: var(--dim); }
.ln { width: 22px; height: 2px; display: inline-block; }
.ln.gold { background: linear-gradient(90deg, #e8c473, #ffe3a8); box-shadow: 0 0 6px rgba(232, 196, 115, 0.8); }
.ln.red { background: repeating-linear-gradient(90deg, #f87171 0 4px, transparent 4px 7px); }
@media (max-width: 640px) { .vx-canvas { height: 380px; } }
</style>
