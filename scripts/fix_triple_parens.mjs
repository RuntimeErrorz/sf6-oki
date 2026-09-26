import fs from 'fs';
import path from 'path';

const CHARACTERS_DIR = 'src/data/characters';

const CLEAN_FIXES = {
  akuma: {
    kd_forward_jump_only_aerial_tatsumaki_senpu_kyaku_overdrive: {
      nameZh: '空中龙卷斩空脚 (OD版) (前跳限定) 击倒',
      input: 'j.214KK'
    }
  },
  cammy: {
    kd_spiral_arrow_heavy_kick_full_charge: {
      nameZh: '螺旋箭 (重脚蓄力) (236HK[蓄]) 击倒',
      input: '236HK (hold)'
    },
    kd_cannon_spike_heavy_kick_full_charge: {
      nameZh: '加农尖刺 (重脚蓄力) (623HK[蓄]) 击倒',
      input: '623HK (hold)'
    },
    kd_hooligan_combination_overdrive_razor_s_edge_slicer: {
      nameZh: '流氓绝杀 (OD版) > 剃刀滑铲 (236PP > 空过) 击倒',
      input: '236PP > 空过'
    }
  },
  chunli: {
    kd_spinning_bird_kick_light_kick: {
      nameZh: '回旋鹤脚蹴 (轻脚) ([2]~8LK) 击倒',
      input: '[2]~8LK'
    }
  },
  ehonda: {
    kd_sumo_headbutt_light_punch: {
      nameZh: '超级头槌 (轻拳) ([4]~6LP) 击倒',
      input: '[4]~6LP'
    },
    kd_sumo_headbutt_medium_punch: {
      nameZh: '超级头槌 (中拳) ([4]~6MP) 击倒',
      input: '[4]~6MP'
    },
    kd_sumo_headbutt_heavy_punch: {
      nameZh: '超级头槌 (重拳) ([4]~6HP) 击倒',
      input: '[4]~6HP'
    },
    kd_sumo_headbutt_overdrive: {
      nameZh: '超级头槌 (OD版) ([4]~6PP) 击倒',
      input: '[4]~6PP'
    }
  },
  elena: {
    kd_scratch_wheel_light_kick: {
      nameZh: '刮骨风车 (轻脚) (623LK) 击倒',
      input: '623LK'
    },
    kd_scratch_wheel_medium_kick: {
      nameZh: '刮骨风车 (中脚) (623MK) 击倒',
      input: '623MK'
    },
    kd_scratch_wheel_heavy_kick: {
      nameZh: '刮骨风车 (重脚) (623HK) 击倒',
      input: '623HK'
    },
    kd_scratch_wheel_overdrive: {
      nameZh: '刮骨风车 (OD版) (623KK) 击倒',
      input: '623KK'
    }
  },
  mai: {
    kd_hishou_ryuuenjin_light_kick: {
      nameZh: '飞翔龙炎阵 (轻脚) (623LK) 击倒',
      input: '623LK'
    },
    kd_hishou_ryuuenjin_medium_kick: {
      nameZh: '飞翔龙炎阵 (中脚) (623MK) 击倒',
      input: '623MK'
    },
    kd_hishou_ryuuenjin_heavy_kick: {
      nameZh: '飞翔龙炎阵 (重脚) (623HK) 击倒',
      input: '623HK'
    },
    kd_hishou_ryuuenjin_overdrive: {
      nameZh: '飞翔龙炎阵 (OD版) (623KK) 击倒',
      input: '623KK'
    },
    kd_air_chou_hissatsu_shinobi_bachi_level_2: {
      nameZh: '空中超必杀忍蜂 (SA2 / j.236236K) 击倒',
      input: 'j.236236K'
    }
  }
};

const files = fs.readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.ts') && f !== 'index.ts');

for (const file of files) {
  const charId = file.replace('.ts', '');
  const filePath = path.join(CHARACTERS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');

  const charFixes = CLEAN_FIXES[charId] || {};

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

console.log('Applied clean triple parens fixes.');
