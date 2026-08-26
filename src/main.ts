import { createApp } from 'vue'
import '@fontsource/zcool-kuaile'
import './styles/global.css'
import App from './App.vue'
import router from './router'
import { vReveal } from './lib/reveal'
import { vTilt } from './lib/tilt'
import { vMagnetic, vCountup, initSmoothScroll } from './lib/motion'
import { initThemes } from './lib/themes'

initThemes()
initSmoothScroll(router)
createApp(App)
  .use(router)
  .directive('reveal', vReveal)
  .directive('tilt', vTilt)
  .directive('magnetic', vMagnetic)
  .directive('countup', vCountup)
  .mount('#app')
