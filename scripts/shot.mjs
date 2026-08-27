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
  const notFound = []
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 200)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)) })
  page.on('response', (r) => { if (r.status() === 404) notFound.push(r.url().slice(-80)) })
  await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 45000 })
  await new Promise((r) => setTimeout(r, 1200))
  // Lenis 接管了 window.scrollTo，得用滚轮事件喂它；逐步滚到底触发所有 v-reveal
  const total = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < total; y += 600) {
    await page.mouse.wheel(0, 600)
    await new Promise((r) => setTimeout(r, 70))
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await new Promise((r) => setTimeout(r, 1400))
  // 无头快速滚动可能漏掉部分 IntersectionObserver 触发：截图前强制点亮所有浮现元素
  await page.evaluate(() => {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'))
  })
  await new Promise((r) => setTimeout(r, 500))
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  if (notFound.length) errors.push('404: ' + notFound.slice(0, 3).join(', '))
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
