/* 视觉核查截图：桌面 + 移动双视口 */
import puppeteer from 'puppeteer'
import { mkdirSync } from 'node:fs'

const CHROME = process.env.CHROME_PATH
const BASE = 'http://localhost:4173'
const OUT = '../_shots'
mkdirSync(OUT, { recursive: true })

const ROUTES = [
  ['home', '/#/'],
  ['chart', '/#/chart'],
  ['daily', '/#/daily'],
  ['almanac', '/#/almanac'],
  ['wuxing', '/#/wuxing'],
  ['ziwei', '/#/ziwei'],
  ['liuyao', '/#/liuyao'],
  ['sages', '/#/sages'],
  ['map', '/#/map'],
  ['memory', '/#/memory'],
  ['qimen', '/#/qimen'],
  ['rules', '/#/rules'],
]

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1'],
})

async function shoot(name, route, viewport, ua) {
  const page = await browser.newPage()
  if (ua) await page.setUserAgent(ua)
  await page.setViewport(viewport)
  const errors = []
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 200)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)) })
  await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 45000 })
  await new Promise((r) => setTimeout(r, 1200))
  // 逐步滚到底触发所有 v-reveal，再回顶部截全页
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.7
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 90))
    }
    window.scrollTo(0, 0)
  })
  await new Promise((r) => setTimeout(r, 1400))
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  if (errors.length) {
    console.log(`[${name}] ${errors.slice(0, 4).join(' | ')}`)
  }
  await page.close()
}

const DESKTOP = { width: 1366, height: 900 }
const MOBILE = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

for (const [name, route] of ROUTES) {
  try {
    await shoot(name, route, DESKTOP)
    console.log(`ok ${name} desktop`)
  } catch (e) { console.log(`FAIL ${name}: ${String(e).slice(0, 120)}`) }
}
for (const [name, route] of [['home', '/#/'], ['daily', '/#/daily'], ['almanac', '/#/almanac'], ['wuxing', '/#/wuxing'], ['sages', '/#/sages'], ['memory', '/#/memory']]) {
  try {
    await shoot(name + '-m', route, MOBILE, IPHONE_UA)
    console.log(`ok ${name} mobile`)
  } catch (e) { console.log(`FAIL ${name}-m: ${String(e).slice(0, 120)}`) }
}
await browser.close()
