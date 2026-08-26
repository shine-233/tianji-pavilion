const fs = require('fs')
const raw = fs.readFileSync('smoke.json', 'utf8')
const i = raw.indexOf('{"numTotalTestSuites"')
if (i < 0) { console.log('no json'); process.exit(0) }
const j = JSON.parse(raw.slice(i))
for (const tr of j.testResults) {
  for (const a of tr.assertionResults) {
    if (a.status === 'failed') {
      console.log('FAILED:', a.title)
      const msg = a.failureMessages[0] || ''
      console.log(msg.split('\n').slice(0, 14).join('\n'))
      console.log('---')
    }
  }
}
