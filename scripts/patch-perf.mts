import fs from 'node:fs'

const files = [
  'src/components/VoxelWuxing.vue',
  'src/components/SageVoxel3D.vue',
  'src/components/ZiweiSky3D.vue',
  'src/components/DayunVoyage3D.vue',
  'src/views/StoryView.vue',
]

for (const f of files) {
  let t = fs.readFileSync(f, 'utf8')
  if (t.includes('FrameGate')) {
    console.log(f, 'already patched')
    continue
  }

  // 1) 引入 perf
  t = t.replace(
    /import \* as THREE from 'three'/,
    "import * as THREE from 'three'\nimport { FrameGate, dprCap } from '../lib/perf'",
  )

  // 2) 声明 gate
  t = t.replace('let disposed = false', 'let disposed = false\nlet gate: FrameGate | null = null')

  // 3) 像素比按设备档位封顶，并在创建后挂上门控
  t = t.replace(
    /renderer\.setPixelRatio\(Math\.min\(window\.devicePixelRatio,[^)]*\)\)/,
    'renderer.setPixelRatio(dprCap(2))\n  gate = gate ?? new FrameGate(renderer.domElement)',
  )

  // 4) 渲染调用加门控
  t = t.replace('composer?.render()', 'if (gate?.shouldRender) composer?.render()')
  t = t.replace('renderer.render(scene, camera)', 'if (gate?.shouldRender) renderer.render(scene, camera)')

  // 5) 卸载时释放
  t = t.replace(
    /cancelAnimationFrame\(raf\)/,
    'cancelAnimationFrame(raf)\n    gate?.dispose()',
  )

  fs.writeFileSync(f, t)
  const ok = t.includes('FrameGate') && t.includes('dprCap(2)') && t.includes('gate?.dispose()')
  console.log(f, ok ? 'PATCHED' : 'CHECK MANUALLY')
}
