import fs from 'fs';
import path from 'path';

const CHARACTERS_DIR = 'src/data/characters';

const GLOSSARY = [
  // General fighting game terms
  [/\bLight Punch\b/gi, '轻拳'],
  [/\bMedium Punch\b/gi, '中拳'],
  [/\bHeavy Punch\b/gi, '重拳'],
  [/\bLight Kick\b/gi, '轻脚'],
  [/\bMedium Kick\b/gi, '中脚'],
  [/\bHeavy Kick\b/gi, '重脚'],
  [/\bHard Kick\b/gi, '重脚'],
  [/\bOverdrive\b/gi, 'OD版'],
  [/\bPunish Counter\b/gi, '确反破招 (PC)'],
  [/\bCounter Hit\b/gi, '打断破招 (CH)'],
  [/\bNeutral Jump\b/gi, '原地跳'],
  [/\bForward Jump\b/gi, '前跳'],
  [/\bBack Jump\b/gi, '后跳'],
  [/\bForward\b/gi, '前'],
  [/\bBack\b/gi, '后'],
  [/\bDown-Forward\b/gi, '斜下前'],
  [/\bDown-Back\b/gi, '斜下后'],
  [/\bDown\b/gi, '下'],
  [/\bJump\b/gi, '跳'],
  [/\bPunch\b/gi, '拳'],
  [/\bKick\b/gi, '脚'],
  [/\bThrow\b/gi, '投'],
  [/\bFull Charge\b/gi, '蓄力最大'],
  [/\(Forward Jump Only\)/gi, '(前跳限定)'],
  [/\(During Forward Jump Only\)/gi, '(前跳限定)'],
  [/\(前跳 Only\)/gi, '(前跳限定)'],
  [/During 前跳 Only/gi, '前跳限定'],
  [/Air 超必杀忍蜂/gi, '空中超必杀忍蜂'],
  [/Air 龙卷/gi, '空中龙卷'],
  [/Air Chou/gi, '空中超'],
  [/前 Air 投/gi, '空中前投 (6LP+LK)'],
  [/后 Air 投/gi, '空中后投 (4LP+LK)'],
  [/Aerial 闪光勾拳/gi, '空中闪光指节拳'],
  [/Aerial 闪光指节拳/gi, '空中闪光指节拳'],
  [/Aerial 武神旋风脚/gi, '空中武神旋风脚'],
  [/Arc Step/gi, '飞燕脚'],
  [/Emergeny Stop/gi, '急停'],
  [/Heel Strike/gi, '踵落踢'],

  // A.K.I.
  [/Venomous Fang/gi, '毒牙突刺'],
  [/Entrapment/gi, '困缚蛇缠'],
  [/Deadly Implication/gi, '致命暗示'],
  [/Claws of Ya Zi/gi, '睚眦之爪'],
  [/Qiong Qi/gi, '穷奇连段'],
  [/Serpent Lash/gi, '蛇头鞭刃'],
  [/Nightshade Pulse/gi, '曼陀罗气泡'],
  [/Nightshade Chaser/gi, '曼陀罗引爆'],
  [/Orchid Wreath/gi, '兰花花环'],
  [/Cruel Fate/gi, '残酷宿命'],
  [/Burst/gi, '引爆'],
  [/Orchid Spring/gi, '兰花毒池'],
  [/Snake Step/gi, '伏地蛇步'],
  [/Swallow's Wing/gi, '燕尾穿刺'],
  [/Poisonous Cloud/gi, '毒云喷射'],
  [/Sinister Slide/gi, '恶意滑行'],
  [/Deadly Imbalance/gi, '致命失衡'],
  [/Tainted Talons/gi, '淬毒利爪'],
  [/Claws of Ya Wang/gi, '阎王之爪'],

  // Akuma
  [/Empyrean/gi, '天冲'],
  [/Demon Raid/gi, '百鬼袭'],
  [/Demon Swoop/gi, '百鬼豪潜'],
  [/Demon Blade 脚/gi, '百鬼豪刃'],
  [/Demon Low Slash/gi, '百鬼豪斩'],
  [/Demon Guillotine/gi, '百鬼豪掌'],
  [/Demon Gou Zanku/gi, '百鬼豪刃'],
  [/Demon Gou Rasen/gi, '百鬼豪碎'],
  [/Tenma Gozanku/gi, '天魔豪斩空'],
  [/Messatsu Goshoryu/gi, '灭杀豪升龙'],
  [/Messatsu Gosenpu/gi, '灭杀豪旋风'],
  [/Great Demon Hadoken/gi, '大豪波动拳'],
  [/Rago High Kick/gi, '罗睺高踢'],
  [/Kikoku Combination/gi, '鬼哭连击'],
  [/Gou 波动拳/gi, '豪波动拳'],
  [/Zanku 波动拳/gi, '斩空波动拳'],
  [/Gou 升龙拳/gi, '豪升龙拳'],
  [/Gou Hadoken/gi, '豪波动拳'],
  [/Zanku Hadoken/gi, '斩空波动拳'],
  [/Gou Shoryuken/gi, '豪升龙拳'],
  [/Tatsumaki Zankukyaku/gi, '龙卷斩空脚'],
  [/Aerial Tatsumaki Zankukyaku/gi, '空中龙卷斩空脚'],
  [/Hyakkishu/gi, '百鬼袭'],
  [/Ashura Senku/gi, '阿修罗闪空'],
  [/Messatsu Gohado/gi, '灭杀豪波动'],
  [/Embu/gi, '崩天劫火'],
  [/Magma Exhalation/gi, '祸坏神灭'],
  [/Shun Goku Satsu/gi, '瞬狱杀'],

  // Blanka
  [/Coward Crouch/gi, '胆小鬼下蹲'],
  [/Raid 跳/gi, '突袭大跳'],
  [/Surprise 前 Hop/gi, '惊奇前跃 (6KK)'],
  [/Surprise 后 Hop/gi, '惊奇后跃 (4KK)'],
  [/Backstep 滚行突击/gi, '后撤滚行突击'],
  [/Wild Lift/gi, '野性挑空'],
  [/Shout of Earth/gi, '大地咆哮'],
  [/Wild Nail/gi, '野性之爪'],
  [/Amazon River Run/gi, '亚马逊河滑行'],
  [/Electric Thunder/gi, '电击雷鸣'],
  [/Aerial 滚行突击/gi, '空中滚行突击'],
  [/Vertical 滚行突击/gi, '对空垂直滚行'],
  [/Rolling Attack/gi, '滚行突击'],
  [/Vertical Rolling/gi, '对空滚行'],
  [/Backstep Rolling/gi, '后撤滚行'],
  [/Wild Hunt/gi, '野性狩猎'],
  [/Blanka-chan Bomb/gi, '布兰卡玩偶炸弹'],
  [/Rolling Cannon/gi, '连环加农滚行'],
  [/Lightning Beast/gi, '雷霆野兽'],
  [/Ground Shave Cannonball/gi, '地面刮削火球'],

  // E. Honda
  [/Ultimate Killer Head Ram/gi, '超级鬼无双'],
  [/The Final Bout/gi, '千秋乐'],
  [/Power Stomp/gi, '四股踏'],
  [/Sumo Dash/gi, '相扑冲刺'],
  [/Hundred Hand Slap/gi, '百裂张手'],
  [/Triple Slap/gi, '三连拍击'],
  [/Taiho Cannon Lift/gi, '大炮掀翻投'],
  [/Show of Force/gi, '武力彰显'],
  [/Sumo Headbutt/gi, '超级头槌'],
  [/Sumo Smash/gi, '百贯落'],
  [/Oicho Throw/gi, '大银杏投'],
  [/Sumo Spirit/gi, '相扑力气'],
  [/Neko Damashi/gi, '拍手猫骗'],
  [/Showstopper/gi, '终场好戏'],
  [/Super Sumo Smash/gi, '超级相扑百贯'],
  [/Ultimate Golden Combo/gi, '究极金字塔连击'],

  // Elena
  [/Meteor Volley/gi, '流星连击'],
  [/Revival Dance/gi, '复苏之舞'],
  [/Round Arch/gi, '圆弧后踢'],
  [/Lynx Song/gi, '猞猁之歌'],
  [/Moon Glider/gi, '月影滑行'],
  [/Slide/gi, '滑行扫踢'],
  [/Raptor Range/gi, '猛禽连击'],
  [/Leopard Snap/gi, '金钱豹重扣'],
  [/Harvest Circle/gi, '丰收之轮'],
  [/Moon Glider Followup/gi, '月影滑行派生'],
  [/Handstand Whip/gi, '倒立鞭踢连段'],
  [/Hind Kick/gi, '后踵强踢'],
  [/Turning Tail/gi, '回旋扫尾'],
  [/Trunk Slap/gi, '象鼻拍击三连'],
  [/Mallet Smash/gi, '战锤重扣'],
  [/Spin Scythe/gi, '旋转回旋镰'],
  [/Rhino Horn/gi, '犀角突进'],
  [/Scratch Wheel/gi, '刮骨风车'],
  [/Healing/gi, '疗愈之舞'],
  [/Spinning Beat/gi, '旋转节拍'],
  [/Brave Dance/gi, '勇者之舞'],

  // Jamie
  [/Breakin'?/gi, '霹雳舞步'],
  [/Getsuga Saiho/gi, '月牙碎锋'],
  [/The Devil's Song/gi, '绝唱'],
  [/The Devil/gi, '绝品魔饮'],
  [/Hermit/gi, '仙人掌'],
  [/无赖疾步 > 拳 Followup 1/gi, '无赖疾步 > 刺拳一段'],
  [/无赖疾步 > 拳 Followup 2/gi, '无赖疾步 > 刺拳冲拳二段'],
  [/无赖疾步 > 脚 Followup 1/gi, '无赖疾步 > 扫腿一段'],
  [/无赖疾步 > 脚 Followup 2/gi, '无赖疾步 > 扫腿连踢二段'],
  [/Swagger Hermit 拳/gi, '醉步回首拳'],
  [/Bakkai/gi, '爆回'],
  [/The Drunken Sweep/gi, '醉步扫腿连击'],
  [/Full Moon Kick/gi, '满月踢连段'],
  [/Intoxicated Assault/gi, '醉拳突击'],
  [/Ransui Haze/gi, '乱水连踢'],
  [/Freeflow Strikes/gi, '无赖疾步'],
  [/Swagger Step/gi, '醉步冲拳'],
  [/Arrow Kick/gi, '绝招箭踢'],
  [/Luminous Dive Kick/gi, '幻影流星落'],
  [/The Devil's Drink/gi, '绝品魔饮'],
  [/Tenshin/gi, '点穴转身投'],
  [/Braelic Dance/gi, '醉武连击'],
  [/Getsuga Saihou/gi, '月牙碎锋'],
  [/Rikushou Senkou/gi, '六星连珠'],

  // Ken
  [/Kasai Thrust 脚/gi, '火塞刺突踢'],
  [/急速冲刺 > Thunder 脚/gi, '急速冲刺 > 紫电踵落'],
  [/急速冲刺 > 前 Step 脚/gi, '急速冲刺 > 踏步突进踢'],
  [/Kazekama Shin 脚/gi, '风镰下段踢'],
  [/Gorai Axe 脚/gi, '轰雷战斧踢'],
  [/Chin Buster/gi, '碎颚连段'],
  [/Triple Flash Kick/gi, '闪光连环踢'],
  [/Senka Snap Kick/gi, '闪光连环踢'],
  [/Inazuma Kick/gi, '闪电踢'],
  [/Jinrai Kick/gi, '迅雷脚'],
  [/Dragonlash Kick/gi, '龙尾脚'],
  [/Shippu Jinrai-kyaku/gi, '疾风迅雷脚'],
  [/Guren Enjinkan/gi, '红莲炎迅脚'],
  [/Shinryuken/gi, '神龙拳'],

  // Kimberly
  [/Bushin Hojin 脚/gi, '武神崩阵脚'],
  [/Shuriken Bomb \/ Genius at Play/gi, '手里剑烟幕弹 / 绝妙巧思'],
  [/Nue Twister/gi, '鵺鸟回旋投'],
  [/Bushin Ninjastar Cypher/gi, '武神八艘飞'],
  [/Step Up \(Hisen 脚 > Up\/Up-前\/Up-后\)/gi, '踏步升空 (飞燕脚派生)'],
  [/Bushin Tiger Fangs/gi, '武神虎牙'],
  [/Bushin Prism Strikes/gi, '武神棱镜四连击'],
  [/Bushin Hellchain Throw/gi, '武神地狱锁链投'],
  [/Bushin Hellchain/gi, '武神地狱锁链'],
  [/Bushin Senpukyaku/gi, '武神旋风脚'],
  [/Bushin Beats/gi, '武神节拍'],
  [/Bushin Scramble/gi, '武神乱击'],
  [/Bushin Ninjitsu Beat/gi, '武神忍法节拍'],
  [/Bushin Izuna Otoshi/gi, '武神饭纲落'],
  [/Torso Cleaver/gi, '斩躯踢'],
  [/Shadow Slide/gi, '影滑步'],
  [/Neck Hunter/gi, '猎颈突击'],
  [/Sprint/gi, '疾走'],
  [/Vagabond Edge/gi, '浪人斩刃'],
  [/Hidden Variable/gi, '隐匿烟雾弹'],
  [/Genius at Work/gi, '喷漆罐制作'],

  // Rashid
  [/Run > 前 \+ 脚/gi, '疾走 > 腾空裂踢'],
  [/Run > 前 \+ 拳/gi, '疾走 > 强力冲拳'],
  [/Rising Kick/gi, '升空连踢'],
  [/Spinning Mixer/gi, '旋转搅拌机'],
  [/Eagle Spike/gi, '鹰头强袭'],
  [/Whirlwind Shot/gi, '旋风射击'],
  [/Arabian Cyclone/gi, '阿拉伯气旋'],
  [/Wing Stroke/gi, '展翅前翻'],
  [/Rolling Assault/gi, '翻滚闪避'],
  [/Nail Assault/gi, '钉刺突袭'],
  [/Arabian Skyhigh/gi, '空中阿拉伯滑翔'],
  [/Super Rashid Kick/gi, '超级拉希德强踢'],
  [/Ysaar/gi, '巨型龙卷'],
  [/Altair/gi, '牵牛星飓风'],
  [/Side Flip/gi, '侧跃翻腾 (6KK)'],
  [/Front Flip/gi, '前空翻 (KK)'],
];

function cleanBilingualString(str) {
  if (!str) return str;
  let res = str;

  for (const [pattern, repl] of GLOSSARY) {
    res = res.replace(pattern, repl);
  }

  res = res.replace(/\s*\([a-zA-Z\s,+-/>]+\)/g, (match) => {
    if (/\b(SA1|SA2|SA3|OD|PC|CA|DP|Lv\.\d|TC|PP|KK|DDT)\b/i.test(match)) {
      return match;
    }
    return '';
  });

  res = res.replace(/\(\s*\)/g, '').replace(/\[\s*\]/g, '').replace(/\s+/g, ' ').trim();
  res = res.replace(/(\([^)]+\))\s*\1/g, '$1');

  return res;
}

const files = fs.readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.ts') && f !== 'index.ts');

for (const file of files) {
  const filePath = path.join(CHARACTERS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace nameZh in knockdowns and moves
  content = content.replace(/(["']?nameZh["']?\s*:\s*["'])([^"']+)(["'])/g, (_m, p1, p2, p3) => {
    return p1 + cleanBilingualString(p2) + p3;
  });

  // Replace description in knockdowns
  content = content.replace(/(["']?description["']?\s*:\s*["'])([^"']+)(["'])/g, (_m, p1, p2, p3) => {
    return p1 + cleanBilingualString(p2) + p3;
  });

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Processed all character files.');
