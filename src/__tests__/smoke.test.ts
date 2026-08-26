/** 全站冒烟测试：逐路由挂载 App（内存路由规避 happy-dom hash 导航限制） */
import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../App.vue'
import HomeView from '../views/HomeView.vue'
import { vReveal } from '../lib/reveal'
import { vMagnetic, vCountup } from '../lib/motion'

const ROUTES = [
  { path: '/', component: HomeView },
  { path: '/chart', component: () => import('../views/ChartView.vue') },
  { path: '/ziwei', component: () => import('../views/ZiweiView.vue') },
  { path: '/liuyao', component: () => import('../views/LiuyaoView.vue') },
  { path: '/meihua', component: () => import('../views/MeihuaView.vue') },
  { path: '/daily', component: () => import('../views/DailySignView.vue') },
  { path: '/almanac', component: () => import('../views/AlmanacView.vue') },
  { path: '/oracle', redirect: '/daily' },
  { path: '/wuxing', component: () => import('../views/WuxingView.vue') },
  { path: '/classics', component: () => import('../views/ClassicsView.vue') },
  { path: '/geju', component: () => import('../views/GejuView.vue') },
  { path: '/rules', component: () => import('../views/RulesView.vue') },
  { path: '/cases', component: () => import('../views/CasesView.vue') },
  { path: '/sages', component: () => import('../views/SageGallery.vue') },
  { path: '/yanyi', component: () => import('../views/YanYiView.vue') },
  { path: '/settings', component: () => import('../views/SettingsView.vue') },
  { path: '/qimen', component: () => import('../views/QimenView.vue') },
  { path: '/map', component: () => import('../views/MapView.vue') },
  { path: '/shuzi', component: () => import('../views/ShuziView.vue') },
  { path: '/jiaobei', component: () => import('../views/JiaobeiView.vue') },
  { path: '/xiaoliuren', component: () => import('../views/XiaoLiurenView.vue') },
  { path: '/memory', component: () => import('../views/MemoryView.vue') },
]

const SAFE_ROUTES: Array<[string, string]> = [
  ['/', '命理天工'],
  ['/liuyao', '六爻'],
  ['/oracle', '签'],
  ['/daily', '签'],
  ['/almanac', '历'],
  ['/meihua', '梅花'],
  ['/ziwei', '紫微'],
  ['/qimen', '奇门'],
  ['/map', '地图'],
  ['/shuzi', '数字'],
  ['/jiaobei', '筊'],
  ['/xiaoliuren', '小六壬'],
  ['/memory', '卦象'],
]

function makeRouter(): ReturnType<typeof createRouter> {
  return createRouter({ history: createMemoryHistory(), routes: ROUTES })
}

describe('smoke: app mounts on every lightweight route', () => {
  it('router table covers all nav destinations', () => {
    const r = makeRouter()
    const paths = r.getRoutes().map((x) => x.path)
    expect(paths).toContain('/chart')
    expect(paths).toContain('/wuxing')
    expect(paths).toContain('/sages')
    expect(paths).toContain('/classics')
    expect(paths).toContain('/yanyi')
    expect(paths).toContain('/settings')
  })

  for (const [path, marker] of SAFE_ROUTES) {
    it(`mounts ${path}`, async () => {
      const errors: unknown[] = []
      const router = makeRouter()
      const app = createApp(defineComponent({ render: () => h(App) }))
      app.use(router)
      app.directive('reveal', vReveal)
      app.directive('magnetic', vMagnetic)
      app.directive('countup', vCountup)
      app.config.errorHandler = (err) => errors.push(err)
      router.push(path)
      await router.isReady()
      const root = document.createElement('div')
      document.body.appendChild(root)
      app.mount(root)
      await nextTick()
      await new Promise((r) => setTimeout(r, 40))
      const html = root.innerHTML
      app.unmount()
      root.remove()
      expect(errors, `runtime errors on ${path}: ${errors.map(String).join(' | ')}`).toEqual([])
      expect(html.length).toBeGreaterThan(200)
      expect(html).toContain(marker)
    })
  }

  it('data-heavy views are importable (module scope executes)', async () => {
    const mods = await Promise.all([
      import('../views/ChartView.vue'),
      import('../views/ClassicsView.vue'),
      import('../views/GejuView.vue'),
      import('../views/RulesView.vue'),
      import('../views/CasesView.vue'),
      import('../views/WuxingView.vue'),
      import('../views/SageGallery.vue'),
      import('../views/StoryView.vue'),
    ])
    expect(mods).toHaveLength(8)
    for (const m of mods) expect(m.default).toBeTruthy()
  })
})
