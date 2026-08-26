<script setup lang="ts">
/**
 * 紫微星空盘：十二宫升上夜空，主星化作发光星体
 * 互动：拖拽旋转 / 滚轮缩放 / 点击宫位选中（与平面盘联动）/ 闲置自转
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { sfx } from '../lib/sfx'

export interface SkyPalace {
  index: number
  name: string
  ganzhi: string
  mains: string
  extras: string[]
}

const props = defineProps<{ palaces: SkyPalace[] | null; mingIndex: number; selected: number | null }>()
const emit = defineEmits<{ select: [i: number] }>()

const container = ref<HTMLDivElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let group: THREE.Group | null = null
let sectorMeshes: THREE.Mesh[] = []
let haloMesh: THREE.Mesh | null = null
let raf = 0
let disposed = false

let dragging = false
let lastX = 0
let movedPx = 0
let targetRotY = 0
let camY = 8.6
let camYTarget = 8.6
let idleTimer: number | null = null
const raycaster = new THREE.Raycaster()
const ndc = new THREE.Vector2()

function disposeSceneObjects(): void {
  sectorMeshes.forEach((m) => {
    m.geometry.dispose()
    ;(m.material as THREE.Material).dispose()
  })
  sectorMeshes = []
  if (haloMesh) {
    haloMesh.geometry.dispose()
    ;(haloMaterial()).dispose()
    group?.remove(haloMesh)
    haloMesh = null
  }
  if (group && scene) {
    group.traverse((o) => {
      if (o instanceof THREE.Sprite) {
        o.material.map?.dispose()
        o.material.dispose()
      } else if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
        const mm = (o as THREE.Mesh).material as THREE.Material | undefined
        if (mm && !(sectorMeshes.includes(o as THREE.Mesh))) mm.dispose()
        const gg = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined
        gg?.dispose()
      }
    })
    scene.remove(group)
    group = null
  }
}

let _haloMat: THREE.MeshBasicMaterial | null = null
function haloMaterial(): THREE.MeshBasicMaterial {
  if (!_haloMat) _haloMat = new THREE.MeshBasicMaterial({ color: 0xffd76e, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
  return _haloMat
}

function textSprite(text: string, color: string, scale = 1): THREE.Sprite {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 96
  const g = c.getContext('2d')!
  g.font = '600 52px "Noto Serif SC", serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.shadowColor = color
  g.shadowBlur = 18
  g.fillStyle = color
  g.fillText(text.slice(0, 4), 128, 50)
  const tex = new THREE.CanvasTexture(c)
  tex.anisotropy = 2
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  const sp = new THREE.Sprite(mat)
  sp.scale.set(1.9 * scale, 0.72 * scale, 1)
  return sp
}

function starColor(name: string): string {
  if (/禄$|权$|魁$|钺$/.test(name)) return '#ffe08a'
  if (/忌$|^擎羊|^陀罗|^火星|^铃星|^地空|^地劫/.test(name)) return '#ff8585'
  if (/^文昌|^文曲|^左辅|^右弼|^禄存|^天马/.test(name)) return '#7de8c3'
  return '#e9e2cf'
}

function angleOf(i: number): number {
  return -Math.PI / 2 + (i * Math.PI * 2) / 12
}

function buildSky(): void {
  if (!scene || !group || !props.palaces) return
  disposeSceneObjects()
  group.clear()
  sectorMeshes = []

  const pal = props.palaces
  pal.forEach((p, i) => {
    const a0 = angleOf(i) - Math.PI / 12 + 0.028
    const a1 = angleOf(i) + Math.PI / 12 - 0.028
    const geo = new THREE.RingGeometry(3.1, 6.3, 20, 1, -a1, a1 - a0)
    geo.rotateX(-Math.PI / 2)
    const isMing = p.index === props.mingIndex
    const isSel = props.selected === i
    const mat = new THREE.MeshStandardMaterial({
      color: isSel ? 0x6b5bd6 : isMing ? 0x8a6a2f : 0x223047,
      emissive: new THREE.Color(isSel ? 0x2a2350 : isMing ? 0x3a2c10 : 0x101a28),
      roughness: 0.62,
      metalness: 0.25,
      transparent: true,
      opacity: 0.94,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.userData.palaceIndex = i
    group!.add(mesh)
    sectorMeshes.push(mesh)

    /* 宫位名贴片 */
    const lr = 6.95
    const nameSp = textSprite(p.name, isMing ? '#ffe3a8' : 'rgba(214,222,236,0.85)', 0.86)
    nameSp.position.set(Math.cos(angleOf(i)) * lr, 0.16, -Math.sin(angleOf(i)) * lr)
    group!.add(nameSp)

    /* 主星辰体 */
    const stars = p.mains.split(/\s+/).filter(Boolean)
    stars.forEach((s, k) => {
      const rr = 3.75 + ((k * 0.53 + i * 0.31) % 1.9)
      const aa = angleOf(i) + (((k % 3) - 1) * 0.075)
      const hh = 0.42 + ((k * 0.37 + i * 0.19) % 0.66)
      const col = starColor(s)
      const sg = new THREE.SphereGeometry(k === 0 ? 0.17 : 0.125, 14, 10)
      const sm = new THREE.MeshBasicMaterial({ color: col })
      const smesh = new THREE.Mesh(sg, sm)
      smesh.position.set(Math.cos(aa) * rr, hh, -Math.sin(aa) * rr)
      group!.add(smesh)

      const glowGeo = new THREE.SphereGeometry((k === 0 ? 0.34 : 0.26), 12, 8)
      const glowMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.16 })
      const glow = new THREE.Mesh(glowGeo, glowMat)
      glow.position.copy(smesh.position)
      group!.add(glow)

      const lab = textSprite(s.replace(/(禄|权|科|忌)$/, ''), col, 0.62)
      lab.position.set(smesh.position.x, smesh.position.y + 0.46, smesh.position.z)
      group!.add(lab)
    })
  })

  /* 中央太极台 */
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.05, 0.14, 40),
    new THREE.MeshStandardMaterial({ color: 0x1a2130, roughness: 0.4, metalness: 0.5 }),
  )
  group.add(core)
  const tai = textSprite('☯', '#e8c473', 1.7)
  tai.position.set(0, 0.85, 0)
  group.add(tai)

  /* 选中光环 */
  if (props.selected !== null && props.selected >= 0) {
    const hg = new THREE.RingGeometry(3.02, 3.24, 24, 1, -(angleOf(props.selected) + Math.PI / 12), Math.PI / 6)
    hg.rotateX(-Math.PI / 2)
    haloMesh = new THREE.Mesh(hg, haloMaterial())
    group.add(haloMesh)
  }

  /* 星尘 */
  const n = 300
  const pos = new Float32Array(n * 3)
  for (let k = 0; k < n; k++) {
    pos[k * 3] = (Math.random() - 0.5) * 30
    pos[k * 3 + 1] = Math.random() * 9 + 0.4
    pos[k * 3 + 2] = (Math.random() - 0.5) * 30
  }
  const dg = new THREE.BufferGeometry()
  dg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xbfcbe0, size: 0.06, transparent: true, opacity: 0.55 }))
  group.add(dust)
}

function animate(): void {
  if (disposed || !renderer || !scene || !camera || !group) return
  raf = requestAnimationFrame(animate)
  if (!dragging) targetRotY += 0.0016
  group.rotation.y += (targetRotY - group.rotation.y) * 0.09
  camY += (camYTarget - camY) * 0.08
  camera.position.y = camY
  camera.lookAt(0, 0.4, 0)
  const t = performance.now() / 1000
  if (haloMesh) {
    const m = haloMaterial()
    m.opacity = 0.32 + 0.26 * Math.sin(t * 4.2)
  }
  renderer.render(scene, camera)
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
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function onPointerMove(e: PointerEvent): void {
  if (!dragging) return
  const dx = e.clientX - lastX
  movedPx += Math.abs(dx)
  lastX = e.clientX
  targetRotY += dx * 0.0062
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
  const hit = raycaster.intersectObjects(sectorMeshes, false)[0]
  if (hit) {
    const idx = (hit.object.userData as { palaceIndex?: number }).palaceIndex ?? null
    if (idx !== null && idx !== undefined) {
      emit('select', idx)
      sfx.pop()
    }
  }
}
function onWheel(e: WheelEvent): void {
  e.preventDefault()
  camYTarget = Math.max(4.4, Math.min(15, camYTarget + e.deltaY * 0.011))
  scheduleIdle()
}
function scheduleIdle(): void {
  if (idleTimer !== null) window.clearTimeout(idleTimer)
  idleTimer = window.setTimeout(() => {
    targetRotY += Math.PI * 2
  }, 5200)
}

watch(() => [props.palaces, props.selected, props.mingIndex], () => buildSky(), { deep: false })

onMounted(() => {
  const el = container.value
  if (!el) return
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(el.clientWidth, el.clientHeight)
  el.appendChild(renderer.domElement)
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x0b0d14, 0.028)
  camera = new THREE.PerspectiveCamera(46, el.clientWidth / el.clientHeight, 0.1, 140)
  camera.position.set(0, camY, 11.4)
  camera.lookAt(0, 0.3, 0)

  scene.add(new THREE.AmbientLight(0xf2ead8, 0.75))
  const key = new THREE.DirectionalLight(0xffeccb, 1.25)
  key.position.set(4, 10, 7)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0x6fb8ff, 0.5)
  rim.position.set(-8, 5, -9)
  scene.add(rim)

  group = new THREE.Group()
  scene.add(group)
  buildSky()

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
  window.removeEventListener('resize', onResize)
  const el = container.value
  if (el) {
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerup', onPointerUp)
    el.removeEventListener('wheel', onWheel)
  }
  if (idleTimer !== null) window.clearTimeout(idleTimer)
  disposeSceneObjects()
  renderer?.dispose()
  el?.querySelector('canvas')?.remove()
})
</script>

<template>
  <div class="zs-wrap">
    <div ref="container" class="zs-canvas"></div>
    <span class="zs-hint">拖拽旋转 · 滚轮升降 · 点击宫位查看详情</span>
  </div>
</template>

<style scoped>
.zs-wrap { position: relative; width: 100%; height: 400px; border-radius: 14px; overflow: hidden; border: 1px solid var(--line); background: radial-gradient(120% 90% at 50% 0%, rgba(var(--acc-rgb), 0.07), transparent 60%), #07080d; }
.zs-canvas { position: absolute; inset: 0; cursor: grab; touch-action: none; }
.zs-canvas:active { cursor: grabbing; }
.zs-hint {
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
@media (max-width: 700px) { .zs-wrap { height: 320px; } }
</style>
