<script setup lang="ts">
/**
 * AuroraBloom —— 整站级 WebGL 氛围层
 * 固定在视口最底层的柔光辉光：真实 UnrealBloomPass 泛光，
 * 颜色跟随主题令牌，位置随滚动缓慢漂移、随鼠标轻微视差。
 */
import { onBeforeUnmount, onMounted } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { LOW_END, dprCap } from '../lib/perf'

const THEME_VARS = ['--gold', '--teal', '--water', '--fire', '--wood', '--gold-bright']

function readThemeColors(): THREE.Color[] {
  const cs = getComputedStyle(document.documentElement)
  return THEME_VARS.map((v) => {
    const raw = cs.getPropertyValue(v).trim() || '#e8c473'
    return new THREE.Color(raw)
  })
}

function glowTexture(color: string): THREE.Texture {
  const s = 128
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const ctx = cv.getContext('2d')!
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, color)
  g.addColorStop(0.35, color + '88')
  g.addColorStop(1, '#00000000')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  const tex = new THREE.CanvasTexture(cv)
  tex.needsUpdate = true
  return tex
}

let disposed = false
let raf = 0
let cleanupResize: (() => void) | null = null
let cleanupTheme: (() => void) | null = null

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const host = document.getElementById('aurora-host')!
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' })
  } catch {
    return // 无 WebGL 环境（测试/极旧设备）直接静默降级
  }
  // 低端机：DPR 压到 1、光团减半、跳过 bloom 后处理
  renderer.setPixelRatio(dprCap(1.5))
  renderer.setSize(host.clientWidth, host.clientHeight)
  renderer.domElement.id = 'aurora-canvas'
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, host.clientWidth / host.clientHeight, 0.1, 100)
  camera.position.z = 20

  // 六团辉光：颜色来自当前主题令牌
  let colors = readThemeColors()
  const orbs: Array<{ sprite: THREE.Sprite; base: THREE.Vector3; phase: number; speed: number }> = []
  // 光团贴边角、整体缩小：氛围留给他，正文区保持干净
  const layoutFull = [
    { x: -13, y: 6.5, size: 6.5 }, { x: 13.5, y: 5, size: 5.5 }, { x: -11, y: -6.5, size: 5 },
    { x: 12, y: -7, size: 6 }, { x: 0, y: 9, size: 4.5 }, { x: 16, y: -1.5, size: 4 },
  ]
  const layout = LOW_END ? layoutFull.slice(0, 4) : layoutFull
  layout.forEach((cfg, i) => {
    const mat = new THREE.SpriteMaterial({
      map: glowTexture('#ffffff'),
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      color: colors[i % colors.length]!,
    })
    const sp = new THREE.Sprite(mat)
    sp.position.set(cfg.x, cfg.y, -2 - i * 0.4)
    sp.scale.setScalar(cfg.size)
    scene.add(sp)
    orbs.push({ sprite: sp, base: new THREE.Vector3(cfg.x, cfg.y, sp.position.z), phase: i * 1.7, speed: 0.12 + i * 0.05 })
  })

  function recolor(): void {
    colors = readThemeColors()
    orbs.forEach((o, i) => {
      (o.sprite.material as THREE.SpriteMaterial).color.copy(colors[i % colors.length]!)
    })
  }
  recolor()

  // 真实泛光后处理（低端机跳过：加法混合本身已有柔光感）
  let composer: EffectComposer | null = null
  if (!LOW_END) {
    composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(host.clientWidth, host.clientHeight), 0.35, 0.85, 0.25))
  }

  function hexToCss(c: THREE.Color): string {
    return '#' + c.getHexString()
  }

  // 换肤时重绘贴图底色
  cleanupTheme = (() => {
    const apply = (): void => {
      recolor()
      orbs.forEach((o, i) => {
        const c = colors[i % colors.length]!
        ;(o.sprite.material as THREE.SpriteMaterial).map?.dispose()
        ;(o.sprite.material as THREE.SpriteMaterial).map = glowTexture(hexToCss(c))
        ;(o.sprite.material as THREE.SpriteMaterial).needsUpdate = true
      })
    }
    const mo = new MutationObserver(apply)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  })()

  // 鼠标视差 + 滚动漂移
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
  const onMouse = (e: MouseEvent): void => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2
  }
  if (!reduced) window.addEventListener('mousemove', onMouse)

  const resize = (): void => {
    const w = host.clientWidth
    const h = host.clientHeight
    renderer.setSize(w, h)
    composer?.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    if (reduced && !disposed) renderFrame() // 减动效：窗口变化后补一帧，避免画面拉伸陈旧
  }
  window.addEventListener('resize', resize)
  cleanupResize = () => window.removeEventListener('resize', resize)

  const clock = new THREE.Clock()
  const renderFrame = (): void => {
    const t = clock.getElapsedTime()
    const sy = window.scrollY || 0
    const docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    const sp = Math.min(1, sy / docH)
    mouse.x += (mouse.tx - mouse.x) * 0.04
    mouse.y += (mouse.ty - mouse.y) * 0.04

    for (const o of orbs) {
      o.sprite.position.x = o.base.x + Math.sin(t * o.speed + o.phase) * 1.4 + mouse.x * 1.1
      o.sprite.position.y = o.base.y + Math.cos(t * o.speed * 0.8 + o.phase) * 1.1 + mouse.y * 0.8 - sp * 7
      o.sprite.material.opacity = 0.26 + Math.sin(t * 0.5 + o.phase) * 0.07 + sp * 0.06
    }
    camera.position.x = mouse.x * 0.5
    camera.position.y = -mouse.y * 0.35
    camera.lookAt(0, 0, 0)
    if (composer) composer.render()
    else renderer.render(scene, camera)
  }
  const tick = (): void => {
    if (disposed) return
    if (!reduced) raf = requestAnimationFrame(tick)
    else if (raf !== -1) {
      // 减动效：只渲染一帧静置
      raf = -1
    }
    // 减动效模式下首帧也照常渲染（页面隐藏时浏览器本来就节流）
    if (document.hidden && !reduced) return
    renderFrame()
    if (reduced) return // 减动效：只渲染一帧静置
  }
  tick()

  const onVisChange = (): void => {
    // 减动效用户从隐藏标签页回来时补一帧，避免黑屏
    if (reduced && !document.hidden) renderFrame()
  }
  document.addEventListener('visibilitychange', onVisChange)

  onBeforeUnmount(() => {
    disposed = true
    cancelAnimationFrame(raf)
    cleanupResize?.()
    cleanupTheme?.()
    document.removeEventListener('visibilitychange', onVisChange)
    renderer.domElement.remove()
    composer?.dispose()
    scene.traverse((o) => {
      if (o instanceof THREE.Sprite) {
        o.material.map?.dispose()
        o.material.dispose()
      }
    })
    renderer.dispose()
  })
})
</script>

<template>
  <div id="aurora-host" aria-hidden="true"></div>
</template>

<style scoped>
#aurora-host {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
#aurora-host :deep(#aurora-canvas) {
  width: 100%;
  height: 100%;
  display: block;
  opacity: 0.75;
}
</style>
