import { createApp } from 'vue'
import '@fontsource/zcool-kuaile'
import './styles/global.css'
import App from './App.vue'
import router from './router'
import { vReveal } from './lib/reveal'
import { vTilt } from './lib/tilt'
import { initThemes } from './lib/themes'

initThemes()
createApp(App).use(router).directive('reveal', vReveal).directive('tilt', vTilt).mount('#app')
