import fs from 'fs';
import path from 'path';

const CHARACTERS_DIR = 'src/data/characters';

const FINAL_FIXES = {
  luke: {
    kd_forward_heavy_punch_heavy_punch: {
      nameZh: '原力火箭拳派生 (6HP > 5HP) 击倒',
      input: '6HP > 5HP'
    },
    kd_snapback_combo_medium_punch_medium_punch_medium_punch_medium_punch: {
      nameZh: '回弹连击 (5MPx4) 击倒',
      input: '5MPx4'
    }
  },
  manon: {
    kd_down_forward_heavy_kick_tomoe_derriere: {
      nameZh: '巴投后扫踢 (3HK) 击倒',
      input: '3HK'
    },
    kd_arabesque_level_1: {
      nameZh: '蔓藤花纹 (SA1 / 236236K) 击倒',
      input: '236236K'
    },
    kd_etoile_level_2: {
      nameZh: '璀璨之星 (SA2 / 214214K) 击倒',
      input: '214214K'
    },
    kd_pas_de_deux_level_3: {
      nameZh: '双人舞 (SA3/CA / 236236P) 击倒',
      input: '236236P'
    }
  },
  mai: {
    kd_kagerou_no_mai_level_1: {
      nameZh: '阳炎之舞 (SA1 / 236236P) 击倒',
      input: '236236P'
    },
    kd_chou_hissatsu_shinobi_bachi_level_2: {
      nameZh: '超必杀忍蜂 (SA2 / 236236K) 击倒',
      input: '236236K'
    },
    kd_air_chou_hissatsu_shinobi_bachi_level_2: {
      nameZh: '空中超必杀忍蜂 (SA2 / j.236236K) 击倒',
      input: 'j.236236K'
    },
    kd_shiranui_ryu_ougi_kunoichi_level_3: {
      nameZh: '不知火流·艳舞花樱 (SA3/CA / 214214P) 击倒',
      input: '214214P'
    }
  },
  lily: {
    kd_raging_typhoon_level_3: {
      nameZh: '狂怒台风 (SA3/CA / 720P) 击倒',
      input: '720P'
    }
  },
  rashid: {
    kd_arabian_skyhigh_heavy_kick: {
      nameZh: '空中阿拉伯滑翔 (重脚) (j.214HK) 击倒',
      input: 'j.214HK'
    }
  }
};

const files = fs.readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.ts') && f !== 'index.ts');

for (const file of files) {
  const charId = file.replace('.ts', '');
  const filePath = path.join(CHARACTERS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');

  const charFixes = FINAL_FIXES[charId] || {};

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

console.log('Applied final polish fixes.');
