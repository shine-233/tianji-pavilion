import { createApp } from 'vue'
import '@fontsource/zcool-kuaile'
import './styles/global.css'
import App from './App.vue'
import { vReveal } from './lib/reveal'
import { vTilt } from './lib/tilt'

createApp(App).directive('reveal', vReveal).directive('tilt', vTilt).mount('#app')
