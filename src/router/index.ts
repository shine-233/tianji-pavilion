import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/chart', name: 'chart', component: () => import('../views/ChartView.vue') },
    { path: '/ziwei', name: 'ziwei', component: () => import('../views/ZiweiView.vue') },
    { path: '/liuyao', name: 'liuyao', component: () => import('../views/LiuyaoView.vue') },
    { path: '/meihua', name: 'meihua', component: () => import('../views/MeihuaView.vue') },
    { path: '/daily', name: 'daily', component: () => import('../views/DailySignView.vue') },
    { path: '/almanac', name: 'almanac', component: () => import('../views/AlmanacView.vue') },
    { path: '/wuxing', name: 'wuxing', component: () => import('../views/WuxingView.vue') },
    { path: '/classics', name: 'classics', component: () => import('../views/ClassicsView.vue') },
    { path: '/geju', name: 'geju', component: () => import('../views/GejuView.vue') },
    { path: '/rules', name: 'rules', component: () => import('../views/RulesView.vue') },
    { path: '/cases', name: 'cases', component: () => import('../views/CasesView.vue') },
    { path: '/oracle', redirect: '/daily' },
    { path: '/jiaobei', name: 'jiaobei', component: () => import('../views/JiaobeiView.vue') },
    { path: '/xiaoliuren', name: 'xiaoliuren', component: () => import('../views/XiaoLiurenView.vue') },
    { path: '/sages', name: 'sages', component: () => import('../views/SageGallery.vue') },
    { path: '/story', name: 'story', component: () => import('../views/StoryView.vue') },
    { path: '/yanyi', name: 'yanyi', component: () => import('../views/YanYiView.vue') },
    { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
