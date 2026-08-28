import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

/* 部署更新后，旧标签页里的 index.html 会引用已被替换的 chunk（懒加载 404），
   页面从此白屏。这里兜底：加载失败 5 秒内只整页重载一次，拿最新版本。 */
const CHUNK_RETRY_KEY = 'tp-chunk-retry-at'
function onChunkFail(): void {
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RETRY_KEY) || 0)
    if (Date.now() - last < 5000) return
    sessionStorage.setItem(CHUNK_RETRY_KEY, String(Date.now()))
  } catch {
    /* 隐私模式存不了就算了 */
  }
  window.location.reload()
}
function lazyView(load: () => Promise<{ default: unknown }>): () => Promise<{ default: unknown }> {
  return () => load().catch((err) => {
    onChunkFail()
    throw err
  })
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/chart', name: 'chart', component: lazyView(() => import('../views/ChartView.vue')) },
    { path: '/ziwei', name: 'ziwei', component: lazyView(() => import('../views/ZiweiView.vue')) },
    { path: '/liuyao', name: 'liuyao', component: lazyView(() => import('../views/LiuyaoView.vue')) },
    { path: '/meihua', name: 'meihua', component: lazyView(() => import('../views/MeihuaView.vue')) },
    { path: '/daily', name: 'daily', component: lazyView(() => import('../views/DailySignView.vue')) },
    { path: '/almanac', name: 'almanac', component: lazyView(() => import('../views/AlmanacView.vue')) },
    { path: '/wuxing', name: 'wuxing', component: lazyView(() => import('../views/WuxingView.vue')) },
    { path: '/classics', name: 'classics', component: lazyView(() => import('../views/ClassicsView.vue')) },
    { path: '/geju', name: 'geju', component: lazyView(() => import('../views/GejuView.vue')) },
    { path: '/rules', name: 'rules', component: lazyView(() => import('../views/RulesView.vue')) },
    { path: '/cases', name: 'cases', component: lazyView(() => import('../views/CasesView.vue')) },
    { path: '/oracle', redirect: '/daily' },
    { path: '/qimen', name: 'qimen', component: lazyView(() => import('../views/QimenView.vue')) },
    { path: '/map', name: 'map', component: lazyView(() => import('../views/MapView.vue')) },
    { path: '/shuzi', name: 'shuzi', component: lazyView(() => import('../views/ShuziView.vue')) },
    { path: '/jiaobei', name: 'jiaobei', component: lazyView(() => import('../views/JiaobeiView.vue')) },
    { path: '/xiaoliuren', name: 'xiaoliuren', component: lazyView(() => import('../views/XiaoLiurenView.vue')) },
    { path: '/sages', name: 'sages', component: lazyView(() => import('../views/SageGallery.vue')) },
    { path: '/memory', name: 'memory', component: lazyView(() => import('../views/MemoryView.vue')) },
    { path: '/story', name: 'story', component: lazyView(() => import('../views/StoryView.vue')) },
    { path: '/yanyi', name: 'yanyi', component: lazyView(() => import('../views/YanYiView.vue')) },
    { path: '/settings', name: 'settings', component: lazyView(() => import('../views/SettingsView.vue')) },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
