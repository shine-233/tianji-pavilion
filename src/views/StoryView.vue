<script setup lang="ts">
/**
 * 易道长卷 —— 滚动叙事线
 * 六幕：无极 → 太极 → 两仪 → 五行 → 八卦 → 六十四卦。
 * 滚动只改数字（progress），画面在 rAF 里读取；文字面板按进度窗口淡入淡出。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import { FrameGate, dprCap } from '../lib/perf'
import { sfx } from '../lib/sfx'

const router = useRouter()

const CHAPTERS = [
  { key: 'wuji', title: '无极', sub: '开始之前', text: '什么都没有。连「没有」这两个字，都还没有。' },
  { key: 'taiji', title: '太极', sub: '一动', text: '有了一点点不一样。动的那半边叫阳，静的那半边叫阴。' },
  { key: 'liangyi', title: '两仪', sub: '分阴分阳', text: '白天与黑夜，进与退，你与镜子里的你——从此有了两边。' },
  { key: 'wuxing', title: '五行', sub: '五种脾气', text: '木火土金水挨个登场。万物各有各的性子，相生相克，谁也别想独走。' },
  { key: 'bagua', title: '八卦', sub: '八个符号', text: '先民把整个世界，压缩成三根爻的八种排列。天、地、雷、风、水、火、山、泽。' },
  { key: 'liushisi', title: '六十四卦', sub: '六十四种处境', text: '卦是处境的名字。你现在站的地方，早在其中一格画好了。——要不要去看看是哪一格？' },
] as const

// 每幕在总进度里的窗口 [起, 峰, 落]
const WINDOWS: Array<[number, number, number]> = [
  [0.0, 0.06, 0.16],
  [0.16, 0.26, 0.34],
  [0.34, 0.43, 0.51],
  [0.51, 0.6, 0.69],
  [0.69, 0.78, 0.86],
  [0.86, 0.95, 1.0],
]

const wrap = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const progress = ref(0)
const activeIdx = ref(0)

function chapterAlpha(i: number): number {
  const p = progress.value
  const [a, b, c] = WINDOWS[i]!
  if (p < a || p > c) return 0
  if (p < b) return (p - a) / (b - a)
  const tail = c - b
  return tail < 1e-4 ? 1 : 1 - (p - b) / tail
}

const panelStyles = computed(() =>
  CHAPTERS.map((_, i) => ({
    opacity: chapterAlpha(i).toFixed(3),
    transform: `translateY(${(1 - chapterAlpha(i)) * 26}px)`,
  })),
)

function railClick(i: number): void {
  sfx.blip()
  const el = wrap.value
  if (!el) return
  const top = el.offsetTop + (i / CHAPTERS.length + 0.02) * (el.clientHeight - window.innerHeight)
  window.scrollTo({ top, behavior: 'smooth' })
}

function goChart(): void {
  sfx.ding()
  router.push('/chart')
}

/* ---------- three.js 场景 ---------- */
let disposed = false
let gate: FrameGate | null = null
let raf = 0

function taijiTexture(): THREE.Texture {
  const s = 512
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const ctx = cv.getContext('2d')!
  ctx.clearRect(0, 0, s, s)
  // 外圆
  ctx.fillStyle = '#e8c473'
  ctx.beginPath()
  ctx.arc(s / 2, s / 2, s / 2 - 8, 0, Math.PI * 2)
  ctx.fill()
  // 两鱼
  ctx.fillStyle = '#10131c'
  ctx.beginPath()
  ctx.arc(s / 2, s / 2, s / 2 - 8, -Math.PI / 2, Math.PI / 2)
  ctx.fill()
  ctx.fillStyle = '#e8c473'
  ctx.beginPath()
  ctx.arc(s / 2, s / 4, s / 4 - 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#10131c'
  ctx.beginPath()
  ctx.arc(s / 2, (3 * s) / 4, s / 4 - 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#10131c'
  ctx.beginPath()
  ctx.arc(s / 2, s / 4, s / 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e8c473'
  ctx.beginPath()
  ctx.arc(s / 2, (3 * s) / 4, s / 14, 0, Math.PI * 2)
  ctx.fill()
  const tex = new THREE.CanvasTexture(cv)
  tex.anisotropy = 4
  return tex
}

function trigramTexture(sym: string): THREE.Texture {
  const s = 128
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const ctx = cv.getContext('2d')!
  ctx.clearRect(0, 0, s, s)
  ctx.font = '84px "Noto Serif SC", serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffe3a8'
  ctx.fillText(sym, s / 2, s / 2 + 4)
  return new THREE.CanvasTexture(cv)
}

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const host = stage.value!
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch {
    return // 无 WebGL 环境静默降级，文字面板仍可用 CSS 展示
  }
  renderer.setPixelRatio(dprCap(2))
  gate = gate ?? new FrameGate(renderer.domElement)
  renderer.setSize(host.clientWidth, host.clientHeight)
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, host.clientWidth / host.clientHeight, 0.1, 100)
  camera.position.set(0, 0, 11)

  // 星尘背景
  const starGeo = new THREE.BufferGeometry()
  const starN = 500
  const pos = new Float32Array(starN * 3)
  for (let i = 0; i < starN; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 40
    pos[i * 3 + 1] = (Math.random() - 0.5) * 24
    pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 4
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xe8c473, size: 0.05, transparent: true, opacity: 0.5 }))
  scene.add(stars)

  // 太极盘
  const taiji = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 5.4),
    new THREE.MeshBasicMaterial({ map: taijiTexture(), transparent: true, opacity: 0 }),
  )
  scene.add(taiji)

  // 两仪双珠
  const orbTex = (hex: string): THREE.Texture => {
    const s = 128
    const cv = document.createElement('canvas')
    cv.width = cv.height = s
    const ctx = cv.getContext('2d')!
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    g.addColorStop(0, hex)
    g.addColorStop(0.4, hex + '99')
    g.addColorStop(1, '#00000000')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
    return new THREE.CanvasTexture(cv)
  }
  const yangOrb = new THREE.Sprite(new THREE.SpriteMaterial({ map: orbTex('#ffe3a8'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
  const yinOrb = new THREE.Sprite(new THREE.SpriteMaterial({ map: orbTex('#7fa8e8'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
  yangOrb.scale.setScalar(2.6)
  yinOrb.scale.setScalar(2.6)
  scene.add(yangOrb, yinOrb)

  // 五行五珠
  const WX_COLORS = ['#7bc47f', '#ef7d57', '#c9a15f', '#d8dde6', '#64a7e8']
  const wxOrbs = WX_COLORS.map((hex) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: orbTex(hex), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
    sp.scale.setScalar(1.9)
    scene.add(sp)
    return sp
  })

  // 八卦符
  const SYMS = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷']
  const tris = SYMS.map((sym) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 1.35),
      new THREE.MeshBasicMaterial({ map: trigramTexture(sym), transparent: true, opacity: 0 }),
    )
    scene.add(m)
    return m
  })

  // 六十四卦点阵（8×8）
  const gridGeo = new THREE.BoxGeometry(0.22, 0.22, 0.05)
  const gridMat = new THREE.MeshBasicMaterial({ color: 0xe8c473, transparent: true, opacity: 0 })
  const grid = new THREE.InstancedMesh(gridGeo, gridMat, 64)
  const dummy = new THREE.Object3D()
  scene.add(grid)

  const smooth01 = (x: number): number => {
    const v = Math.max(0, Math.min(1, x))
    return v * v * (3 - 2 * v)
  }
  /** 幕内局部进度 0~1 */
  const local = (i: number): number => {
    const [a, , c] = WINDOWS[i]!
    return Math.max(0, Math.min(1, (progress.value - a) / Math.max(1e-4, c - a)))
  }

  let mx = 0
  const onMouse = (e: MouseEvent): void => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2
  }
  window.addEventListener('mousemove', onMouse)

  // 触屏没有 mousemove：滚动速度给镜头一点横向摇曳，手机上画面也活
  let lastScrollY: number | null = null
  let sway = 0
  const onTouchSway = (): void => {
    const y = window.scrollY
    if (lastScrollY !== null) sway = Math.max(-1, Math.min(1, sway + (y - lastScrollY) * 0.004))
    lastScrollY = y
  }
  window.addEventListener('scroll', onTouchSway, { passive: true })

  const resize = (): void => {
    renderer.setSize(host.clientWidth, host.clientHeight)
    camera.aspect = host.clientWidth / host.clientHeight
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', resize)

  const clock = new THREE.Clock()
  const tick = (): void => {
    if (disposed) return
    raf = requestAnimationFrame(tick)
    if (document.hidden) return
    const t = clock.getElapsedTime()
    const p = progress.value

    // 1 无极：一点微光
    const wu = smooth01(chapterAlpha(0))
    ;(stars.material as THREE.PointsMaterial).opacity = 0.15 + wu * 0.35

    // 2 太极
    const tj = smooth01(chapterAlpha(1))
    ;(taiji.material as THREE.MeshBasicMaterial).opacity = tj * 0.92
    taiji.scale.setScalar(0.25 + tj * 0.75 + local(1) * 0.08)
    taiji.rotation.z = t * 0.25

    // 3 两仪：双鱼离盘成双珠
    const ly = smooth01(chapterAlpha(2))
    ;(yangOrb.material as THREE.SpriteMaterial).opacity = ly * 0.9
    ;(yinOrb.material as THREE.SpriteMaterial).opacity = ly * 0.9
    ;(taiji.material as THREE.MeshBasicMaterial).opacity *= 1 - local(2) * 0.85
    yangOrb.position.set(Math.cos(t * 0.9) * 3.4, Math.sin(t * 0.9) * 2.2, 1)
    yinOrb.position.set(-Math.cos(t * 0.9) * 3.4, -Math.sin(t * 0.9) * 2.2, 1)

    // 4 五行环
    const wxA = smooth01(chapterAlpha(3))
    wxOrbs.forEach((sp, i) => {
      ;(sp.material as THREE.SpriteMaterial).opacity = wxA * 0.85
      const a = t * 0.55 + (i * Math.PI * 2) / 5
      sp.position.set(Math.cos(a) * 4.1, Math.sin(a) * 4.1 * 0.62, 0.6)
    })

    // 5 八卦环
    const bg = smooth01(chapterAlpha(4))
    tris.forEach((m, i) => {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2
      m.position.set(Math.cos(a) * 5.1, Math.sin(a) * 5.1 * 0.72, 0.8)
      ;(m.material as THREE.MeshBasicMaterial).opacity = bg * 0.95
      m.rotation.y = Math.sin(t * 0.6 + i) * 0.18
    })

    // 6 六十四卦点阵
    const ls = smooth01(chapterAlpha(5))
    gridMat.opacity = ls * 0.9
    const spread = 0.62
    for (let i = 0; i < 64; i++) {
      const gx = (i % 8) - 3.5
      const gy = Math.floor(i / 8) - 3.5
      const appear = Math.max(0, Math.min(1, local(5) * 1.6 - i / 64))
      dummy.position.set(gx * spread * 1.15, gy * spread, 1.4)
      dummy.rotation.z = t * 0.1
      dummy.scale.setScalar(appear)
      dummy.updateMatrix()
      grid.setMatrixAt(i, dummy.matrix)
    }
    grid.instanceMatrix.needsUpdate = true

    stars.rotation.y = p * 0.8
    // 镜头横移 = 鼠标（桌面）+ 滚动进度漂移（全设备）+ 滚速摇曳（触屏）
    sway *= 0.94
    const wantX = mx * 0.6 + Math.sin(p * Math.PI * 2) * 0.35 + sway * 0.8
    camera.position.x += (wantX - camera.position.x) * 0.04
    camera.lookAt(0, 0, 0)

    if (gate?.shouldRender) renderer.render(scene, camera)
    if (reduced) return
  }
  tick()

  const onScroll = (): void => {
    const el = wrap.value
    if (!el) return
    const total = el.clientHeight - window.innerHeight
    progress.value = Math.max(0, Math.min(1, (window.scrollY - el.offsetTop) / Math.max(1, total)))
    activeIdx.value = WINDOWS.findIndex(([a, , c]) => progress.value >= a && progress.value <= c)
    if (activeIdx.value < 0) activeIdx.value = progress.value < 0 ? 0 : CHAPTERS.length - 1
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  onBeforeUnmountCleanup(() => {
    disposed = true
    cancelAnimationFrame(raf)
    gate?.dispose()
    window.removeEventListener('mousemove', onMouse)
    window.removeEventListener('scroll', onTouchSway)
    window.removeEventListener('resize', resize)
    window.removeEventListener('scroll', onScroll)
    // 遍历整棵场景树释放 geometry / material / 贴图（太极、卦符、双珠的 CanvasTexture 都挂在材质上）
    const releaseMat = (m: THREE.Material): void => {
      ;(m as unknown as { map?: THREE.Texture | null }).map?.dispose()
      m.dispose()
    }
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      mesh.geometry?.dispose()
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(mat)) mat.forEach(releaseMat)
      else if (mat) releaseMat(mat)
    })
    scene.clear()
    renderer.dispose()
    host.contains(renderer.domElement) && host.removeChild(renderer.domElement)
  })
})

function onBeforeUnmountCleanup(fn: () => void): void {
  cleanups.push(fn)
}
const cleanups: Array<() => void> = []
onBeforeUnmount(() => {
  cleanups.forEach((f) => f())
})
</script>

<template>
  <div ref="wrap" class="story">
    <!-- 长卷画布（粘性视口） -->
    <div class="pin">
      <div ref="stage" class="stage"></div>
      <div
        v-for="(ch, i) in CHAPTERS"
        :key="ch.key"
        class="panel"
        :style="panelStyles[i]"
      >
        <span class="no">第{{ ['一', '二', '三', '四', '五', '六'][i] }}幕</span>
        <h2>{{ ch.title }}</h2>
        <em>{{ ch.sub }}</em>
        <p>{{ ch.text }}</p>
        <button v-if="i === CHAPTERS.length - 1" class="cta" @click="goChart()">☯ 去排一盘</button>
      </div>

      <!-- 右侧进度轨 -->
      <div class="rail">
        <button
          v-for="(ch, i) in CHAPTERS"
          :key="'r' + ch.key"
          :class="{ on: activeIdx === i }"
          :title="ch.title"
          @click="railClick(i)"
        />
      </div>
      <div class="hint" :style="{ opacity: progress < 0.02 ? 1 : 0 }">↓ 慢慢往下滚</div>
    </div>
    <!-- 撑出滚动长度 -->
    <div class="spacer"></div>
  </div>
</template>

<style scoped>
.story {
  position: relative;
  height: 720vh;
}
.pin {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}
.stage {
  position: absolute;
  inset: 0;
}
.stage :deep(canvas) {
  width: 100%;
  height: 100%;
  display: block;
}
.panel {
  position: absolute;
  left: clamp(20px, 8vw, 120px);
  top: 50%;
  width: min(420px, 76vw);
  transform: translateY(-50%);
  pointer-events: none;
}
.panel .no {
  display: inline-block;
  font-size: 0.72rem;
  letter-spacing: 0.4em;
  color: var(--teal);
  margin-bottom: 10px;
}
.panel h2 {
  font-family: var(--cute);
  font-size: clamp(2.4rem, 7vw, 4rem);
  color: var(--gold-bright);
  line-height: 1.15;
  text-shadow: 0 0 30px var(--glow);
  margin-bottom: 8px;
}
.panel em {
  display: block;
  font-style: normal;
  font-family: var(--cute);
  font-size: 1.05rem;
  color: var(--gold);
  letter-spacing: 0.2em;
  margin-bottom: 14px;
}
.panel p {
  font-size: 0.95rem;
  line-height: 2.15;
  color: var(--fg);
}
.cta {
  pointer-events: auto;
  margin-top: 20px;
  padding: 12px 26px;
  font-size: 1rem;
}
.rail {
  position: absolute;
  right: clamp(14px, 3vw, 40px);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rail button {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1.5px solid var(--gold);
  background: transparent;
  cursor: pointer;
  padding: 0;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.rail button.on {
  background: var(--gold-bright);
  box-shadow: 0 0 12px var(--glow);
  transform: scale(1.25);
}
.hint {
  position: absolute;
  bottom: 34px;
  left: 50%;
  transform: translateX(-50%);
  color: var(--dim);
  font-family: var(--cute);
  letter-spacing: 0.3em;
  transition: opacity 0.5s ease;
}

@media (max-width: 720px) {
  .story { height: 620vh; }
  .panel { left: 20px; right: 60px; width: auto; }
  .rail { right: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .story { height: auto; }
  .pin { position: static; height: 60vh; }
  .panel { display: none; }
  .rail { display: none; }
  .hint { display: none; }
}
</style>
