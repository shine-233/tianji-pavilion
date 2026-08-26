/**
 * 紫微十四主星 · 女道士拟人化
 * 每颗主星对应云鹤观里一位当值女道士：道号、司职、性情、专属道袍配色。
 * 头像复用十位道士的像素骨架（buildTaoess），按星曜替换袍色。
 */
import { buildTaoess } from './sageSprite'
import type { TaoPixel } from './sageSprite'

export interface StarPersona {
  star: string
  ming: string
  title: string
  nature: string
  hello: string
  /** 道袍主色 R / 辅色 D / 饰金 Y */
  robe: string
  trim: string
  gold: string
  /** 复用哪位道士的像素骨架 */
  base: string
}

export const STAR_PERSONAS: Record<string, StarPersona> = {
  紫微: { star: '紫微', ming: '紫微真人', title: '观主 · 北辰', nature: '尊贵 · 化权', hello: '我是观主。帝座之星，主孤高也主担当——你命宫见我，先学会扛起事来。', robe: '#7a5cc4', trim: '#b39aff', gold: '#ffe9a8', base: 'qingxuan' },
  天机: { star: '天机', ming: '机衡子', title: '司算 · 掌棋局', nature: '智巧 · 善谋', hello: '落子别急。天机善变，我教你的第一课是想三步、走一步。', robe: '#4a8fb5', trim: '#9fd0e8', gold: '#fff2c8', base: 'xinglan' },
  太阳: { star: '太阳', ming: '曦和君', title: '司光 · 掌博爱', nature: '光明 · 操劳', hello: '日头照四方，也照得自己发烫。肯付出是福分，但记得给自己留片荫凉。', robe: '#d98e2b', trim: '#ffcf7d', gold: '#fff7dd', base: 'danxia' },
  武曲: { star: '武曲', ming: '铗金娘', title: '司财 · 掌决断', nature: '刚毅 · 财星', hello: '账要清，话要短。武曲的钱是挣出来的，不是等出来的——手起刀落，别拖。', robe: '#8a6d3b', trim: '#d8c08a', gold: '#ffeebc', base: 'shuanghua' },
  天同: { star: '天同', ming: '同尘师太', title: '司福 · 掌安逸', nature: '温和 · 福星', hello: '急什么？茶还没凉。天同的福气在知足，日子过得顺，比什么都强。', robe: '#5f9e8f', trim: '#a8dcc9', gold: '#fdf3d1', base: 'suwen' },
  廉贞: { star: '廉贞', ming: '青肃娘子', title: '司囚 · 掌规矩', nature: '棱角 · 化忌亦化权', hello: '规矩立得住，人才站得直。廉贞带刺，刺伤人也护住人，看你怎么用。', robe: '#a04a68', trim: '#e09ab2', gold: '#ffe6ee', base: 'meixue' },
  天府: { star: '天府', ming: '府藏夫人', title: '司库 · 掌稳重', nature: '厚重 · 令星', hello: '库房满了心里才不慌。天府会攒——攒钱、攒人缘、攒底气，都是本事。', robe: '#6b7d3c', trim: '#b5c78a', gold: '#f7f0cf', base: 'yunji' },
  太阴: { star: '太阴', ming: '望舒姑娘', title: '司月 · 掰柔静', nature: '温柔 · 田宅主', hello: '月亮不争白天的热闹。太阴的富，是静下来之后才看得见的那种。', robe: '#5a6fa8', trim: '#aabce0', gold: '#f4f7ff', base: 'shouzhuo' },
  贪狼: { star: '贪狼', ming: '醉桃仙', title: '司欲 · 掌机缘', nature: '多才 · 桃花', hello: '想要就说，想学就学。贪狼一身本事都从「贪」字上来，只是别贪杯贪夜。', robe: '#b56aa0', trim: '#ebadda', gold: '#fff0fa', base: 'lingshi' },
  巨门: { star: '巨门', ming: '问津姑', title: '司口 · 掌是非', nature: '善辩 · 暗星', hello: '我把丑话说前头：巨门多疑，疑对了是洞察，疑错了是内耗，界限在你自己。', robe: '#707482', trim: '#b8bcc8', gold: '#f5f6fa', base: 'shiyi' },
  天相: { star: '天相', ming: '持衡女史', title: '司印 · 掌辅弼', nature: '正直 · 衣禄', hello: '我不站C位，我让C位的人不犯错。天相是宰相命，成全别人也是成就自己。', robe: '#4f7d6b', trim: '#96c4ae', gold: '#eff7e8', base: 'danxia' },
  天梁: { star: '天梁', ming: '荫木道长', title: '司荫 · 掌寿数', nature: '老成 · 荫星', hello: '大树底下好乘凉，我就是那棵树。天梁逢凶化吉，但你得先学会让人靠得住。', robe: '#7d6b4f', trim: '#c2b294', gold: '#faf3dc', base: 'suwen' },
  七杀: { star: '七杀', ming: '断霜姐', title: '司杀 · 掌开创', nature: '果决 · 将星', hello: '旧的不去新的不来。七杀宜攻不宜守，乱世开路的刀，太平日子里要收鞘。', robe: '#9e3b3b', trim: '#e08a8a', gold: '#ffecec', base: 'shuanghua' },
  破军: { star: '破军', ming: '裂潮姬', title: '司破 · 掳变更', nature: '先锋 · 耗星', hello: '我先趟过去，碎了的回头再拼。破军不怕重来，怕的是原地不动。', robe: '#3f6f9e', trim: '#8ab8e0', gold: '#eaf5ff', base: 'xinglan' },
}

/** 主星头像：复用女道士像素骨架 + 星曜专属袍色 */
export function starAvatarPixels(star: string): TaoPixel[] {
  const p = STAR_PERSONAS[star]
  if (!p) return []
  return buildTaoess(p.base, { R: p.robe, D: p.trim, Y: p.gold })
}
