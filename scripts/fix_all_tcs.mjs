import fs from 'fs';
import path from 'path';

const CHARACTERS_DIR = 'src/data/characters';

const ALL_KD_FIXES = {
  aki: {
    kd_heavy_punch_heavy_punch_qiong_qi: { nameZh: '穷奇连段 (5HP > 5HP) 击倒', input: '5HP > 5HP' },
    kd_nightshade_chaser_burst: { nameZh: '曼陀罗引爆 (214P > 236P) 击倒', input: '214P > 236P' },
    kd_nightshade_chaser_overdrive_burst: { nameZh: '曼陀罗引爆 (OD版) (214PP > 236P) 击倒', input: '214PP > 236P' },
  },
  akuma: {
    kd_forward_heavy_punch_forward_heavy_punch_heavy_kick_kikoku_combination: { nameZh: '鬼哭连击 (6HP > 5HK) 击倒', input: '6HP > 5HK' },
    kd_shun_goku_satsu_raging_demon_level_3_critical_art_only: { nameZh: '瞬狱杀 (CA) 击倒', input: 'LP LP 6 LK HP' },
  },
  dhalsim: {
    kd_down_back_heavy_kick_karma_kick: { nameZh: '业火踢 (4HK) 击倒', input: '4HK' },
  },
  ed: {
    kd_medium_punch_heavy_punch_body_blow_combination: { nameZh: '碎躯重击连击 (5MP > 5HP) 击倒', input: '5MP > 5HP' },
    kd_medium_kick_medium_kick_heavy_punch_hitman_combination: { nameZh: '杀手三连击 (5MK > 5MK > 5HP) 击倒', input: '5MK > 5MK > 5HP' },
    kd_down_heavy_kick_heavy_punch_low_smash_combination: { nameZh: '下盘重扣连击 (2HK > 5HP) 击倒', input: '2HK > 5HP' },
  },
  ehonda: {
    kd_light_punch_medium_punch: { nameZh: '连携张手 (5LP > 5MP) 击倒', input: '5LP > 5MP' },
  },
  elena: {
    kd_slide_down_forward_heavy_kick: { nameZh: '滑行扫踢 (3HK) 击倒', input: '3HK' },
    kd_handstand_whip_forward_medium_kick_medium_kick: { nameZh: '倒立鞭踢连段 (6MK > 5MK) 击倒', input: '6MK > 5MK' },
    kd_hind_kick_medium_kick_heavy_kick: { nameZh: '后踵强踢 (5MK > 5HK) 击倒', input: '5MK > 5HK' },
    kd_turning_tail_heavy_punch_heavy_punch: { nameZh: '回旋扫尾 (5HP > 5HP) 击倒', input: '5HP > 5HP' },
    kd_trunk_slap_forward_heavy_punch_heavy_punch_heavy_punch: { nameZh: '象鼻拍击三连 (6HP > 5HP > 5HP) 击倒', input: '6HP > 5HP > 5HP' },
    kd_raptor_range_jump_medium_punch_heavy_punch: { nameZh: '猛禽连击 (j.MP > j.HP) 击倒', input: 'j.MP > j.HP' },
  },
  jamie: {
    kd_down_kk: { nameZh: '下盘双踢 (2KK) 击倒', input: '2KK' },
    kd_down_heavy_kick_heavy_kick_punch: { nameZh: '醉步扫腿连击 (2HK > 2HK > P) 击倒', input: '2HK > 2HK > P' },
    kd_forward_medium_kick_medium_kick_punch_full_moon_kick: { nameZh: '满月踢连段 (6MK > 5MK > P) 击倒', input: '6MK > 5MK > P' },
    kd_back_heavy_punch_heavy_punch_heavy_kick_intoxicated_assault: { nameZh: '醉拳突击 (4HP > 5HP > 5HK) 击倒', input: '4HP > 5HP > 5HK' },
    kd_forward_heavy_kick_back_heavy_kick_punch_ransui_haze: { nameZh: '乱水连踢 (6HK > 4HK > P) 击倒', input: '6HK > 4HK > P' },
  },
  juri: {
    kd_medium_punch_back_heavy_punch_heavy_punch: { nameZh: '旋风三连击 (5MP > 4HP > 5HP) 击倒', input: '5MP > 4HP > 5HP' },
  },
  ken: {
    kd_medium_punch_heavy_punch: { nameZh: '碎颚连段 (5MP > 5HP) 击倒', input: '5MP > 5HP' },
    kd_medium_kick_medium_kick_hard_kick: { nameZh: '闪光连环踢 (5MK > 5MK > 5HK) 击倒', input: '5MK > 5MK > 5HK' },
  },
  kimberly: {
    kd_medium_punch_heavy_punch_bushin_tiger_fangs: { nameZh: '武神虎牙 (5MP > 5HP) 击倒', input: '5MP > 5HP' },
    kd_light_punch_medium_punch_heavy_punch_heavy_kick_bushin_prism_strikes: { nameZh: '武神棱镜四连击 (5LP > 5MP > 5HP > 5HK) 击倒', input: '5LP > 5MP > 5HP > 5HK' },
    kd_light_punch_medium_punch_down_heavy_punch_heavy_kick_bushin_hellchain: { nameZh: '武神地狱锁链 (5LP > 5MP > 2HP > 5HK) 击倒', input: '5LP > 5MP > 2HP > 5HK' },
    kd_light_punch_medium_punch_down_heavy_punch_down_heavy_kick_bushin_hellchain_throw: { nameZh: '武神地狱锁链投 (5LP > 5MP > 2HP > 2HK) 击倒', input: '5LP > 5MP > 2HP > 2HK' },
  },
  lily: {
    kd_desert_storm_forward_heavy_punch_heavy_punch_heavy_punch: { nameZh: '沙漠风暴连击 (6HP > 5HP > 5HP) 击倒', input: '6HP > 5HP > 5HP' },
  },
  luke: {
    kd_triple_impact_light_punch_medium_punch_hard_punch: { nameZh: '三连重击 (5LP > 5MP > 5HP) 击倒', input: '5LP > 5MP > 5HP' },
  },
  mai: {
    kd_back_heavy_kick_heavy_kick: { nameZh: '后重脚二连 (4HK > 5HK) 击倒', input: '4HK > 5HK' },
  },
  marisa: {
    kd_forward_medium_punch_heavy_punch: { nameZh: '前中拳重拳连段 (6MP > 5HP) 击倒', input: '6MP > 5HP' },
    kd_forward_medium_punch_heavy_kick: { nameZh: '前中拳重脚连段 (6MP > 5HK) 击倒', input: '6MP > 5HK' },
  }
};

const files = fs.readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.ts') && f !== 'index.ts');

for (const file of files) {
  const charId = file.replace('.ts', '');
  const filePath = path.join(CHARACTERS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');

  const charFixes = ALL_KD_FIXES[charId] || {};

  content = content.replace(/(\{\s*"id":\s*"([^"]+)",[\s\S]*?"tags":\s*\[[\s\S]*?\]\s*\})/g, (fullBlock, _p1, kdId) => {
    try {
      const kd = JSON.parse(fullBlock);
      if (charFixes[kdId]) {
        kd.nameZh = charFixes[kdId].nameZh;
        kd.input = charFixes[kdId].input;
      }
      return JSON.stringify(kd, null, 4);
    } catch {
      return fullBlock;
    }
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Applied ALL remaining target combo knockdown fixes.');
