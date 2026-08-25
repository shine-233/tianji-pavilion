import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/chart', name: 'chart', component: () => import('../views/ChartView.vue') },
    { path: '/ziwei', name: 'ziwei', component: () => import('../views/ZiweiView.vue') },
    { path: '/wuxing', name: 'wuxing', component: () => import('../views/WuxingView.vue') },
    { path: '/liuyao', name: 'liuyao', component: () => import('../views/LiuyaoView.vue') },
    { path: '/oracle', name: 'oracle', component: () => import('../views/OracleView.vue') },
    { path: '/classics', name: 'classics', component: () => import('../views/ClassicsView.vue') },
    { path: '/geju', name: 'geju', component: () => import('../views/GejuView.vue') },
    { path: '/rules', name: 'rules', component: () => import('../views/RulesView.vue') },
    { path: '/cases', name: 'cases', component: () => import('../views/CasesView.vue') },
    { path: '/sages', name: 'sages', component: () => import('../views/SageGallery.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
