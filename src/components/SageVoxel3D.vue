<script setup lang="ts">
/**
 * 立体道长：把像素吉祥物抬进 Three.js
 * 互动：拖拽旋转 / 滚轮缩放 / 点选角色换人（体素弹跳重组）/ 闲置自转 / 环绕星尘
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { buildTaoess, TAOESSES } from '../data/sageSprite'
import { sfx } from '../lib/sfx'

const props = defineProps<{ char: string }>()
const emit = defineEmits<{ pick: [id: string] }>()

const container = ref<HTMLDivElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let group: THREE.Group | null = null
let mesh: THREE.InstancedMesh | null = null
let dust: THREE.Points | null = null
let raf = 0
let disposed = false

let dragging = false
let lastX = 0
let lastY = 0
let movedPx = 0
let targetRotY = -0.35
let targetRotX = 0.08
let camZ = 26
let camZTarget = 26
let popT = 1
let idleTimer: number | null = null
const raycaster = new THREE.Raycaster()

const CELL = 0.62
const DEPTH = 1.15

function disposeModel(): void {
  if (mesh) {
    group?.remove(mesh)
    mesh.geometry.dispose()
    ;(mesh.material as THREE.Material).dispose()
    mesh = null
  }
}

function buildModel(charId: string): void {
  if (!scene || !group) return
  disposeModel()
  const pixels = buildTaoess(charId)
  const geo = new THREE.BoxGeometry(CELL, CELL, CELL * DEPTH)
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.12 })
  mesh = new THREE.InstancedMesh(geo, mat, pixels.length)
  const m = new THREE.Matrix4()
  const color = new THREE.Color()
  const cx = 13
  const cy = 14
  pixels.forEach((p, i) => {
    m.makeTranslation((p.x - cx) * CELL, (cy - p.y) * CELL, 0)
    mesh!.setMatrixAt(i, m)
    color.set(p.fill)
    mesh!.setColorAt(i, color)
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  group.add(mesh)

  group.scale.setScalar(0.01)
  popT = 0
}

function makeDust(): void {
  if (!scene) return
  const n = 260
  const pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 34
    pos[i * 3 + 1] = (Math.random() - 0.5) * 22
    pos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 4
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.PointsMaterial({ color: 0xe8c473, size: 0.09, transparent: true, opacity: 0.65 })
  dust = new THREE.Points(g, mat)
  scene.add(dust)
}

function animate(): void {
  if (disposed || !renderer || !scene || !camera || !group) return
  raf = requestAnimationFrame(animate)
  if (!dragging) targetRotY += 0.0038
  group.rotation.y += (targetRotY - group.rotation.y) * 0.09
  group.rotation.x += (targetRotX - group.rotation.x) * 0.09
  camZ += (camZTarget - camZ) * 0.08
  camera.position.z = camZ

  if (popT < 1) {
    popT = Math.min(1, popT + 0.045)
    const t = 1 - Math.pow(1 - popT, 3)
    const overshoot = 1 + Math.sin(popT * Math.PI) * 0.12
    group.scale.setScalar(Math.max(0.01, t * overshoot))
  }

  const t = performance.now() / 1000
  group.position.y = Math.sin(t * 1.4) * 0.34
  if (dust) {
    dust.rotation.y = t * 0.03
    const pa = dust.geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < pa.count; i += 7) {
      pa.setY(i, pa.getY(i) + 0.006)
      if (pa.getY(i) > 11) pa.setY(i, -11)
    }
    pa.needsUpdate = true
  }
  renderer.render(scene, camera)
}

// 双指捏合缩放
const activePtrs = new Map<number, { x: number; y: number }>()
let pinchStartDist = 0
let pinchStartZ = 0
function ptrDist(): number {
  const [a, b] = [...activePtrs.values()]
  return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
}

function onPointerDown(e: PointerEvent): void {
  activePtrs.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (activePtrs.size === 2) {
    dragging = false
    pinchStartDist = ptrDist()
    pinchStartZ = camZTarget
    return
  }
  dragging = true
  movedPx = 0
  lastX = e.clientX
  lastY = e.clientY
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function onPointerMove(e: PointerEvent): void {
  if (activePtrs.has(e.pointerId)) activePtrs.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (activePtrs.size >= 2) {
    const d = ptrDist()
    if (pinchStartDist > 0 && d > 0) {
      camZTarget = Math.max(16, Math.min(40, (pinchStartZ * pinchStartDist) / d))
    }
    return
  }
  if (!dragging) return
  const dx = e.clientX - lastX
  const dy = e.clientY - lastY
  movedPx += Math.abs(dx) + Math.abs(dy)
  lastX = e.clientX
  lastY = e.clientY
  targetRotY += dx * 0.0075
  targetRotX = Math.max(-0.7, Math.min(0.7, targetRotX + dy * 0.005))
}
function onPointerUp(e: PointerEvent): void {
  activePtrs.delete(e.pointerId)
  if (activePtrs.size === 1) {
    const [rest] = [...activePtrs.values()]
    if (rest) {
      lastX = rest.x
      lastY = rest.y
    }
    dragging = true
    movedPx = 99 // 捏合结束不触发拾取
    return
  }
  if (activePtrs.size > 0) return
  if (!dragging) return
  dragging = false
  scheduleIdle()
  if (movedPx < 6) raycastPick(e)
}
function raycastPick(e: PointerEvent): void {
  if (!container.value || !mesh || !camera) return
  const rect = container.value.getBoundingClientRect()
  const ndc = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1,
  )
  raycaster.setFromCamera(ndc, camera)
  const hit = raycaster.intersectObject(mesh, false)
  if (hit.length) {
    sfx.pop()
    popT = 0
    emit('pick', props.char)
  }
}
function onWheel(e: WheelEvent): void {
  e.preventDefault()
  camZTarget = Math.max(16, Math.min(40, camZTarget + e.deltaY * 0.014))
  scheduleIdle()
}
function scheduleIdle(): void {
  if (idleTimer !== null) window.clearTimeout(idleTimer)
  idleTimer = window.setTimeout(() => {
    targetRotY += Math.PI * 2
  }, 4200)
}

onMounted(() => {
  const el = container.value
  if (!el) return
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(el.clientWidth, el.clientHeight)
  el.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(42, el.clientWidth / el.clientHeight, 0.1, 120)
  camera.position.set(0, 0.4, camZ)

  scene.add(new THREE.AmbientLight(0xfff2dd, 0.85))
  const key = new THREE.DirectionalLight(0xffe9c4, 1.5)
  key.position.set(5, 8, 9)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0x7de8c3, 0.7)
  rim.position.set(-7, -3, -6)
  scene.add(rim)

  group = new THREE.Group()
  scene.add(group)
  makeDust()
  buildModel(props.char)

  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('pointermove', onPointerMove)
  el.addEventListener('pointerup', onPointerUp)
  el.addEventListener('wheel', onWheel, { passive: false })

  window.addEventListener('resize', onResize)
  animate()
})

function onResize(): void {
  const el = container.value
  if (!el || !renderer || !camera) return
  renderer.setSize(el.clientWidth, el.clientHeight)
  camera.aspect = el.clientWidth / el.clientHeight
  camera.updateProjectionMatrix()
}

watch(() => props.char, (c) => {
  if (TAOESSES[c]) {
    buildModel(c)
    sfx.flip()
    // 换人运镜：镜头推近再拉回，道长转身一圈入场
    targetRotY += Math.PI * 2
    popT = 0
    camZTarget = 20
    window.setTimeout(() => {
      camZTarget = 26
    }, 520)
  }
})

onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', onResize)
  const el = container.value
  if (el) {
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerup', onPointerUp)
    el.removeEventListener('wheel', onWheel)
  }
  if (idleTimer !== null) window.clearTimeout(idleTimer)
  disposeModel()
  dust?.geometry.dispose()
  ;(dust?.material as THREE.Material | null)?.dispose()
  renderer?.dispose()
  el?.querySelector('canvas')?.remove()
})
</script>

<template>
  <div class="sv-stage">
    <div ref="container" class="sv-canvas"></div>
    <span class="sv-hint">拖拽转身 · 滚轮拉近 · 点她一下有惊喜</span>
  </div>
</template>

<style scoped>
.sv-stage { position: relative; width: 100%; height: 340px; border-radius: 14px; overflow: hidden; }
.sv-canvas { position: absolute; inset: 0; cursor: grab; touch-action: none; }
.sv-canvas:active { cursor: grabbing; }
.sv-hint {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.68rem;
  color: var(--dim);
  background: rgba(0, 0, 0, 0.28);
  padding: 3px 12px;
  border-radius: 999px;
  pointer-events: none;
  white-space: nowrap;
}
@media (max-width: 560px) {
  .sv-stage { height: 264px; }
}
</style>
