const { Solar } = require('lunar-javascript')

function probe(label, y, m, d, hh) {
  const solar = Solar.fromYmdHms(y, m, d, hh, 30, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()
  const ps = [ec.getYear(), ec.getMonth(), ec.getDay(), ec.getTime()]
  const yun = ec.getYun(1)
  const dy = yun.getDaYun()
  console.log('====', label, ps.join(' '))
  console.log('出生年', y, '起运', yun.getStartYear(), '岁', yun.getStartMonth(), '月')
  dy.forEach((x) => {
    console.log(x.getStartYear(), '-', x.getEndYear(), x.getGanZhi(), '岁', x.getStartAge(), '-', x.getEndAge())
  })
}

probe('natal 2002-10-26 10:30', 2002, 10, 26, 10)
probe('yinshi 1997-10-22 3:30', 1997, 10, 22, 3)
probe('wushi 1997-10-22 11:30', 1997, 10, 22, 11)
