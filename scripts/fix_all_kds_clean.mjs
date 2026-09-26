import fs from 'fs';
import path from 'path';

const CHARACTERS_DIR = 'src/data/characters';

// Character-specific knockdown fixes mapping by charId and kd.id
const KD_FIXES = {
  guile: {
    kd_crouching_heavy_kick: { nameZh: '下重脚 / 扫腿 (2HK) 击倒', input: '2HK' },
    sweep_pc_guile: { nameZh: '下重脚 确反破招 (2HK PC) 击倒', input: '2HK (PC)' },
    kd_medium_punch_back_heavy_punch: { nameZh: '反手重拳连段 (5MP > 4HP) 击倒', input: '5MP > 4HP' },
    kd_down_medium_punch_down_medium_punch_drake_fang: { nameZh: '龙牙二连 (2MP > 2MP) 击倒', input: '2MP > 2MP' },
    kd_down_heavy_kick_down_forward_heavy_kick: { nameZh: '幽灵切击 (5HK > 5HK) 击倒', input: '5HK > 5HK' },
    kd_sonic_boom_overdrive: { nameZh: '音速手刀 (OD版) ([4]~6PP) 击倒', input: '[4]~6PP' },
    kd_flash_kick_light_kick: { nameZh: '脚刀 (轻脚) ([2]~8LK) 击倒', input: '[2]~8LK' },
    kd_flash_kick_medium_kick: { nameZh: '脚刀 (中脚) ([2]~8MK) 击倒', input: '[2]~8MK' },
    kd_flash_kick_heavy_kick: { nameZh: '脚刀 (重脚) ([2]~8HK) 击倒', input: '[2]~8HK' },
    kd_flash_kick_overdrive: { nameZh: '脚刀 (OD版) ([2]~8KK) 击倒', input: '[2]~8KK' },
    kd_sonic_hurricane_level_1: { nameZh: '音速飓风 (SA1 / [4]~6[4]~6P) 击倒', input: '[4]~6[4]~6P' },
    kd_solid_puncher_level_2: { nameZh: '强击装填 (SA2 / 214214P) 击倒', input: '214214P' },
    kd_crossfire_somersault_level_3: { nameZh: '交叉火力倒勾 (SA3/CA / [4]~6[4]~6K) 击倒', input: '[4]~6[4]~6K' },
    kd_forward_throw: { nameZh: '前投 (6LP+LK) 击倒', input: '6LP+LK' },
    kd_back_throw: { nameZh: '后投 (4LP+LK) 击倒', input: '4LP+LK' },
    kd_flying_mare_forward_air_throw: { nameZh: '空中前投 (空中 6LP+LK) 击倒', input: 'j.6LP+LK' },
    kd_flying_buster_drop_back_air_throw: { nameZh: '空中后投 (空中 4LP+LK) 击倒', input: 'j.4LP+LK' },
  },
  ryu: {
    sweep_pc_ryu: { nameZh: '下重脚 确反破招 (2HK PC) 击倒', input: '2HK (PC)' },
    kd_heavy_punch_heavy_kick: { nameZh: '重拳重脚连段 (5HP > 5HK) 击倒', input: '5HP > 5HK' },
    kd_medium_punch_light_kick_heavy_kick_fuwa_triple_strike: { nameZh: '不破三连击 (5MP > 5LK > 5HK) 击倒', input: '5MP > 5LK > 5HK' },
    kd_hadoken_overdrive: { nameZh: '波动拳 (OD版) (236PP) 击倒', input: '236PP' },
    kd_shoryuken_light_punch: { nameZh: '升龙拳 (轻拳) (623LP) 击倒', input: '623LP' },
    kd_shoryuken_medium_punch: { nameZh: '升龙拳 (中拳) (623MP) 击倒', input: '623MP' },
    kd_shoryuken_heavy_punch: { nameZh: '升龙拳 (重拳) (623HP) 击倒', input: '623HP' },
    kd_shoryuken_overdrive: { nameZh: '升龙拳 (OD版) (623PP) 击倒', input: '623PP' },
    kd_tatsumaki_senpu_kyaku_light_kick: { nameZh: '龙卷旋风脚 (轻脚) (214LK) 击倒', input: '214LK' },
    kd_tatsumaki_senpu_kyaku_medium_kick: { nameZh: '龙卷旋风脚 (中脚) (214MK) 击倒', input: '214MK' },
    kd_tatsumaki_senpu_kyaku_heavy_kick: { nameZh: '龙卷旋风脚 (重脚) (214HK) 击倒', input: '214HK' },
    kd_tatsumaki_senpu_kyaku_overdrive: { nameZh: '龙卷旋风脚 (OD版) (214KK) 击倒', input: '214KK' },
    kd_aerial_tatsumaki_senpu_kyaku: { nameZh: '空中龙卷旋风脚 (j.214K) 击倒', input: 'j.214K' },
    kd_forward_jump_only_aerial_tatsumaki_senpu_kyaku_overdrive: { nameZh: '空中龙卷旋风脚 (OD版) (前跳限定) 击倒', input: 'j.214KK' },
    kd_high_blade_kick_light_kick: { nameZh: '刀刃踢 (轻脚) (236LK) 击倒', input: '236LK' },
    kd_high_blade_kick_medium_kick: { nameZh: '刀刃踢 (中脚) (236MK) 击倒', input: '236MK' },
    kd_high_blade_kick_heavy_kick: { nameZh: '刀刃踢 (重脚) (236HK) 击倒', input: '236HK' },
    kd_high_blade_kick_overdrive: { nameZh: '刀刃踢 (OD版) (236KK) 击倒', input: '236KK' },
    kd_hashogeki_heavy_punch: { nameZh: '波掌击 (重拳) (214HP) 击倒', input: '214HP' },
    kd_hadoken_denjin_charge: { nameZh: '波动拳 (电刃练气) (236P) 击倒', input: '236P' },
    kd_hadoken_denjin_charge_overdrive: { nameZh: '波动拳 (电刃练气+OD版) (236PP) 击倒', input: '236PP' },
    kd_hashogeki_denjin_charge: { nameZh: '波掌击 (电刃练气) (214P) 击倒', input: '214P' },
    kd_hashogeki_denjin_charge_overdrive: { nameZh: '波掌击 (电刃练气+OD版) (214PP) 击倒', input: '214PP' },
    kd_shin_hashogeki_level_2: { nameZh: '真·波掌击 (SA2 / 214214P) 击倒', input: '214214P' },
    kd_shin_shoryuken_level_3: { nameZh: '真·升龙拳 (SA3/CA / 236236K) 击倒', input: '236236K' },
    kd_forward_throw: { nameZh: '前投 (6LP+LK) 击倒', input: '6LP+LK' },
    kd_back_throw: { nameZh: '后投 (4LP+LK) 击倒', input: '4LP+LK' },
  },
  ken: {
    sweep_pc_ken: { nameZh: '下重脚 确反破招 (2HK PC) 击倒', input: '2HK (PC)' },
    kd_chin_buster_2nd_medium_punch_heavy_punch: { nameZh: '碎颚连段 (5MP > 5HP) 击倒', input: '5MP > 5HP' },
    kd_triple_flash_kicks_medium_kick_medium_kick_hard_kick: { nameZh: '闪光连环踢 (5MK > 5MK > 5HK) 击倒', input: '5MK > 5MK > 5HK' },
    kd_shoryuken_light_punch: { nameZh: '升龙拳 (轻拳) (623LP) 击倒', input: '623LP' },
    kd_shoryuken_medium_punch: { nameZh: '升龙拳 (中拳) (623MP) 击倒', input: '623MP' },
    kd_shoryuken_heavy_punch: { nameZh: '升龙拳 (重拳) (623HP) 击倒', input: '623HP' },
    kd_shoryuken_overdrive: { nameZh: '升龙拳 (OD版) (623PP) 击倒', input: '623PP' },
    kd_shoryuken_quick_dash: { nameZh: '升龙拳 (疾走派生) (KK > 623P) 击倒', input: 'KK > 623P' },
    kd_tatsumaki_senpu_kyaku_light_kick: { nameZh: '龙卷旋风脚 (轻脚) (214LK) 击倒', input: '214LK' },
    kd_tatsumaki_senpu_kyaku_medium_kick: { nameZh: '龙卷旋风脚 (中脚) (214MK) 击倒', input: '214MK' },
    kd_tatsumaki_senpu_kyaku_heavy_kick: { nameZh: '龙卷旋风脚 (重脚) (214HK) 击倒', input: '214HK' },
    kd_tatsumaki_senpu_kyaku_overdrive: { nameZh: '龙卷旋风脚 (OD版) (214KK) 击倒', input: '214KK' },
    kd_tatsumaki_senpu_kyaku_quick_dash: { nameZh: '龙卷旋风脚 (疾走派生) (KK > 214K) 击倒', input: 'KK > 214K' },
    kd_aerial_tatsumaki_senpu_kyaku: { nameZh: '空中龙卷旋风脚 (j.214K) 击倒', input: 'j.214K' },
    kd_aerial_tatsumaki_senpu_kyaku_overdrive: { nameZh: '空中龙卷旋风脚 (OD版) (j.214KK) 击倒', input: 'j.214KK' },
    kd_dragonlash_kick_heavy_kick: { nameZh: '龙尾脚 (重脚) (623HK) 击倒', input: '623HK' },
    kd_dragonlash_kick_overdrive: { nameZh: '龙尾脚 (OD版) (623KK) 击倒', input: '623KK' },
    kd_dragonlash_kick_quick_dash: { nameZh: '龙尾脚 (疾走派生) (KK > 623K) 击倒', input: 'KK > 623K' },
    kd_jinrai_kick_senka_snap_kick: { nameZh: '迅雷脚 > 旋脚线上段 (236K > 6HK) 击倒', input: '236K > 6HK' },
    kd_jinrai_kick_kasai_thrust_kick: { nameZh: '迅雷脚 > 火塞刺突踢 (236K > 6HK > 6HK) 击倒', input: '236K > 6HK > 6HK' },
    kd_jinrai_kick_overdrive_senka_snap_kick: { nameZh: '迅雷脚 (OD版) > 旋脚线上段 (236KK > 6HK) 击倒', input: '236KK > 6HK' },
    kd_jinrai_kick_overdrive_kasai_thrust_kick: { nameZh: '迅雷脚 (OD版) > 火塞刺突踢 (236KK > 6HK > 6HK) 击倒', input: '236KK > 6HK > 6HK' },
    kd_shippu_jinrai_kyaku_level_1: { nameZh: '疾风迅雷脚 (SA1 / 236236K) 击倒', input: '236236K' },
    kd_guren_enjinkan_level_2: { nameZh: '红莲炎迅脚 (SA2 / 214214K) 击倒', input: '214214K' },
    kd_shinryuken_level_3: { nameZh: '神龙拳 (SA3/CA / 236236P) 击倒', input: '236236P' },
    kd_forward_throw: { nameZh: '前投 (6LP+LK) 击倒', input: '6LP+LK' },
    kd_back_throw: { nameZh: '后投 / 地狱车 (4LP+LK) 击倒', input: '4LP+LK' },
  },
  terry: {
    sweep_pc_terry: { nameZh: '下重脚 确反破招 (2HK PC) 击倒', input: '2HK (PC)' },
    kd_power_drive_medium_punch_heavy_punch: { nameZh: '能量猛击 (5MP > 5HP) 击倒', input: '5MP > 5HP' },
    kd_power_shoot_medium_punch_heavy_kick: { nameZh: '能量飞踢 (5MP > 5HK) 击倒', input: '5MP > 5HK' },
    kd_power_dunk_medium_punch_heavy_kick_heavy_kick: { nameZh: '能量扣杀 (5MP > 5HK > 623MP) 击倒', input: '5MP > 5HK > 623MP' },
    kd_fire_kick_down_medium_kick_down_heavy_kick: { nameZh: '火焰连踢 (2MK > 2HK) 击倒', input: '2MK > 2HK' },
    kd_burning_knuckle_medium_punch: { nameZh: '燃烧指节拳 (中拳) (214MP) 击倒', input: '214MP' },
    kd_burning_knuckle_heavy_punch: { nameZh: '燃烧指节拳 (重拳) (214HP) 击倒', input: '214HP' },
    kd_burning_knuckle_overdrive: { nameZh: '燃烧指节拳 (OD版) (214PP) 击倒', input: '214PP' },
    kd_quick_burn_overdrive: { nameZh: '疾速燃烧拳 (OD版) (214PP) 击倒', input: '214PP' },
    kd_power_charge_medium_kick: { nameZh: '能量冲撞 (中脚) (41236MK) 击倒', input: '41236MK' },
    kd_power_charge_heavy_kick: { nameZh: '能量冲撞 (重脚) (41236HK) 击倒', input: '41236HK' },
    kd_crack_shoot_heavy_kick: { nameZh: '碎石飞踢 (重脚) (214HK) 击倒', input: '214HK' },
    kd_crack_shoot_overdrive: { nameZh: '碎石飞踢 (OD版) (214KK) 击倒', input: '214KK' },
    kd_rising_tackle_light_punch: { nameZh: '升腾倒钩 (轻拳) ([2]~8LP) 击倒', input: '[2]~8LP' },
    kd_rising_tackle_medium_punch: { nameZh: '升腾倒钩 (中拳) ([2]~8MP) 击倒', input: '[2]~8MP' },
    kd_rising_tackle_heavy_punch: { nameZh: '升腾倒钩 (重拳) ([2]~8HP) 击倒', input: '[2]~8HP' },
    kd_rising_tackle_overdrive: { nameZh: '升腾倒钩 (OD版) ([2]~8PP) 击倒', input: '[2]~8PP' },
    kd_buster_wolf_level_1: { nameZh: '爆狼能量拳 (SA1 / 236236K) 击倒', input: '236236K' },
    kd_power_geyser_level_2: { nameZh: '能量喷泉 (SA2 / 214214P) 击倒', input: '214214P' },
    kd_rising_fang_level_3: { nameZh: '升腾苍狼牙 (SA3/CA / 236236P) 击倒', input: '236236P' },
    kd_forward_throw: { nameZh: '前投 (6LP+LK) 击倒', input: '6LP+LK' },
    kd_back_throw: { nameZh: '后投 (4LP+LK) 击倒', input: '4LP+LK' },
  },
  zangief: {
    sweep_pc_zangief: { nameZh: '下重脚 确反破招 (2HK PC) 击倒', input: '2HK (PC)' },
    kd_forward_heavy_kick_cyclone_wheel_kick: { nameZh: '旋风回旋踢 (6HK) 击倒', input: '6HK' },
    kd_down_forward_heavy_kick_smetana_dropkick: { nameZh: '斯美塔那飞身踢 (3HK) 击倒', input: '3HK' },
    kd_medium_punch_medium_punch_medium_punch: { nameZh: '三连中拳 (5MP > 5MP > 5MP) 击倒', input: '5MP > 5MP > 5MP' },
    kd_double_lariat: { nameZh: '双臂旋风勾 (PPP) 击倒', input: 'PPP' },
    kd_double_lariat_overdrive: { nameZh: '双臂旋风勾 (OD版) (KKK) 击倒', input: 'KKK' },
    kd_screw_piledriver_light_punch: { nameZh: '螺旋打桩机 (轻拳) (360LP) 击倒', input: '360LP' },
    kd_screw_piledriver_medium_punch: { nameZh: '螺旋打桩机 (中拳) (360MP) 击倒', input: '360MP' },
    kd_screw_piledriver_heavy_punch: { nameZh: '螺旋打桩机 (重拳) (360HP) 击倒', input: '360HP' },
    kd_screw_piledriver_overdrive: { nameZh: '螺旋打桩机 (OD版) (360PP) 击倒', input: '360PP' },
    kd_borscht_dynamite: { nameZh: '罗宋汤空中炸弹 (j.360K) 击倒', input: 'j.360K' },
    kd_borscht_dynamite_overdrive: { nameZh: '罗宋汤空中炸弹 (OD版) (j.360KK) 击倒', input: 'j.360KK' },
    kd_russian_suplex_siberian_express: { nameZh: '俄罗斯后抛摔 / 西伯利亚特快 (63214K) 击倒', input: '63214K' },
    kd_russian_suplex_overdrive_siberian_express_overdrive: { nameZh: '西伯利亚特快 (OD版) (63214KK) 击倒', input: '63214KK' },
    kd_tundra_storm: { nameZh: '苔原风暴防反 (22HK) 击倒', input: '22HK' },
    kd_aerial_russian_slam_level_1: { nameZh: '空中俄罗斯重摔 (SA1 / 236236K) 击倒', input: '236236K' },
    kd_cyclone_lariat_level_2: { nameZh: '飓风双臂旋 (SA2 / 236236P) 击倒', input: '236236P' },
    kd_bolshoi_storm_buster_level_3: { nameZh: '大剧院风暴粉碎 (SA3/CA / 720P) 击倒', input: '720P' },
    kd_forward_throw: { nameZh: '前投 (6LP+LK) 击倒', input: '6LP+LK' },
    kd_back_throw: { nameZh: '后投 (4LP+LK) 击倒', input: '4LP+LK' },
    kd_down_throw: { nameZh: '下投 (2LP+LK) 击倒', input: '2LP+LK' },
    kd_down_forward_throw: { nameZh: '斜下前投 (3LP+LK) 击倒', input: '3LP+LK' },
    kd_down_back_throw: { nameZh: '斜下后投 (1LP+LK) 击倒', input: '1LP+LK' },
  },
  marisa: {
    sweep_pc_marisa: { nameZh: '下重脚 确反破招 (2HK PC) 击倒', input: '2HK (PC)' },
    kd_heavy_two_hitter_heavy_punch_heavy_punch: { nameZh: '双重重击 (5HP > 5HP) 击倒', input: '5HP > 5HP' },
    kd_down_forward_heavy_punch_down_forward_heavy_punch: { nameZh: '破锤连击 (6HP > 6HP) 击倒', input: '6HP > 6HP' },
    kd_forward_heavy_kick_forward_heavy_kick: { nameZh: '镰刀粉碎踢 (6HK > 6HK) 击倒', input: '6HK > 6HK' },
    kd_caelum_arc_neutral_jump_down_heavy_punch: { nameZh: '空中下坠重拳 (j.2HP) 击倒', input: 'j.2HP' },
    kd_gladius_light_punch: { nameZh: '罗马短剑 (轻拳) (236LP) 击倒', input: '236LP' },
    kd_gladius_medium_punch: { nameZh: '罗马短剑 (中拳) (236MP) 击倒', input: '236MP' },
    kd_gladius_heavy_punch: { nameZh: '罗马短剑 (重拳) (236HP) 击倒', input: '236HP' },
    kd_gladius_overdrive: { nameZh: '罗马短剑 (OD版) (236PP) 击倒', input: '236PP' },
    kd_dimachaerus_light_punch: { nameZh: '双剑连击 (轻拳) (214LP) 击倒', input: '214LP' },
    kd_dimachaerus_medium_punch: { nameZh: '双剑连击 (中拳) (214MP) 击倒', input: '214MP' },
    kd_dimachaerus_heavy_punch: { nameZh: '双剑连击 (重拳) (214HP) 击倒', input: '214HP' },
    kd_dimachaerus_overdrive: { nameZh: '双剑连击 (OD版) (214PP) 击倒', input: '214PP' },
    kd_phalanx_light_punch: { nameZh: '方阵突进 (轻拳) (623LP) 击倒', input: '623LP' },
    kd_phalanx_medium_punch: { nameZh: '方阵突进 (中拳) (623MP) 击倒', input: '623MP' },
    kd_phalanx_heavy_punch: { nameZh: '方阵突进 (重拳) (623HP) 击倒', input: '623HP' },
    kd_phalanx_overdrive: { nameZh: '方阵突进 (OD版) (623PP) 击倒', input: '623PP' },
    kd_quadriga_light_kick: { nameZh: '四马战车 (轻脚) (236LK) 击倒', input: '236LK' },
    kd_quadriga_medium_kick: { nameZh: '四马战车 (中脚) (236MK) 击倒', input: '236MK' },
    kd_quadriga_heavy_kick: { nameZh: '四马战车 (重脚) (236HK) 击倒', input: '236HK' },
    kd_scutum_tonitrus: { nameZh: '大盾格挡 > 惊雷重拳 (214K > 6P) 击倒', input: '214K > 6P' },
    kd_scutum_procella: { nameZh: '大盾格挡 > 暴风下击 (214K > P) 击倒', input: '214K > P' },
    kd_scutum_enfold: { nameZh: '大盾格挡 > 铁臂抱摔 (214K > LP+LK) 击倒', input: '214K > LP+LK' },
    kd_javelin_of_marisa_level_1: { nameZh: '玛丽莎之枪 (SA1 / 236236P) 击倒', input: '236236P' },
    kd_meteorite_level_2: { nameZh: '陨石粉碎 (SA2 / 214214P) 击倒', input: '214214P' },
    kd_goddess_of_the_hunt_level_3: { nameZh: '狩猎女神 (SA3/CA / 236236K) 击倒', input: '236236K' },
    kd_forward_throw: { nameZh: '前投 (6LP+LK) 击倒', input: '6LP+LK' },
    kd_back_throw: { nameZh: '后投 (4LP+LK) 击倒', input: '4LP+LK' },
  },
  rashid: {
    sweep_pc_rashid: { nameZh: '下重脚 确反破招 (2HK PC) 击倒', input: '2HK (PC)' },
    kd_run_forward_kick_tempest_moon: { nameZh: '疾走 > 腾空裂踢 (66 > 6K) 击倒', input: '66 > 6K' },
    kd_medium_punch_heavy_kick_rising_kick: { nameZh: '升空连踢 (5MP > 5HK) 击倒', input: '5MP > 5HK' },
    kd_spinning_mixer_medium_punch: { nameZh: '旋转搅拌机 (中拳) (236MP) 击倒', input: '236MP' },
    kd_spinning_mixer_heavy_punch: { nameZh: '旋转搅拌机 (重拳) (236HP) 击倒', input: '236HP' },
    kd_spinning_mixer_overdrive: { nameZh: '旋转搅拌机 (OD版) (236PP) 击倒', input: '236PP' },
    kd_eagle_spike_light_kick: { nameZh: '鹰头强袭 (轻脚) (214LK) 击倒', input: '214LK' },
    kd_eagle_spike_medium_kick: { nameZh: '鹰头强袭 (中脚) (214MK) 击倒', input: '214MK' },
    kd_eagle_spike_heavy_kick: { nameZh: '鹰头强袭 (重脚) (214HK) 击倒', input: '214HK' },
    kd_eagle_spike_overdrive: { nameZh: '鹰头强袭 (OD版) (214KK) 击倒', input: '214KK' },
    kd_whirlwind_shot: { nameZh: '旋风射击 (236K) 击倒', input: '236K' },
    kd_arabian_cyclone_heavy_punch: { nameZh: '阿拉伯气旋 (重拳) (214HP) 击倒', input: '214HP' },
    kd_arabian_cyclone_overdrive: { nameZh: '阿拉伯气旋 (OD版) (214PP) 击倒', input: '214PP' },
    kd_nail_assault: { nameZh: '钉刺突袭 (214P > 6K > K) 击倒', input: '214P > 6K > K' },
    kd_arabian_skyhigh_light_kick: { nameZh: '空中阿拉伯滑翔 (轻脚) (j.214LK) 击倒', input: 'j.214LK' },
    kd_arabian_skyhigh_medium_kick: { nameZh: '空中阿拉伯滑翔 (中脚) (j.214MK) 击倒', input: 'j.214MK' },
    kd_arabian_skyhigh_heavy_kick: { nameZh: '空中阿拉伯滑翔 (重脚) (j.214HK) 击倒', input: 'j.214HK' },
    kd_super_rashid_kick_level_1: { nameZh: '超级拉希德强踢 (SA1 / 236236K) 击倒', input: '236236K' },
    kd_ysaar_level_2: { nameZh: '巨型龙卷 (SA2 / 214214K) 击倒', input: '214214K' },
    kd_altair_level_3: { nameZh: '牵牛星飓风 (SA3/CA / 236236P) 击倒', input: '236236P' },
    kd_forward_throw: { nameZh: '前投 (6LP+LK) 击倒', input: '6LP+LK' },
    kd_back_throw: { nameZh: '后投 (4LP+LK) 击倒', input: '4LP+LK' },
  },
  luke: {
    sweep_pc_luke: { nameZh: '下重脚 确反破招 (2HK PC) 击倒', input: '2HK (PC)' },
    kd_triple_impact_light_punch_medium_punch_heavy_punch: { nameZh: '三连重击 (5LP > 5MP > 5HP) 击倒', input: '5LP > 5MP > 5HP' },
    kd_snapback_combo_medium_punch_medium_punch_medium_punch_medium_punch: { nameZh: '回弹连击 (5MPx4) 击倒', input: '5MP > 5MP > 5MP > 5MP' },
    kd_sand_blast_overdrive: { nameZh: '爆沙弹 (OD版) (236PP) 击倒', input: '236PP' },
    kd_fatal_shot_overdrive_sandblast_followup: { nameZh: '致命射击 (236PP > P) 击倒', input: '236PP > P' },
    kd_flash_knuckle_light_punch: { nameZh: '闪光指节拳 (轻拳) (214LP) 击倒', input: '214LP' },
    kd_flash_knuckle_medium_punch: { nameZh: '闪光指节拳 (中拳) (214MP) 击倒', input: '214MP' },
    kd_flash_knuckle_heavy_punch: { nameZh: '闪光指节拳 (重拳) (214HP) 击倒', input: '214HP' },
    kd_flash_knuckle_overdrive: { nameZh: '闪光指节拳 (OD版) (214PP) 击倒', input: '214PP' },
    kd_ddt_overdrive_flash_knuckle_followup: { nameZh: 'DDT摔投 (214PP > LP+LK) 击倒', input: '214PP > LP+LK' },
    kd_rising_upper_light_punch: { nameZh: '升腾上勾拳 (轻拳) (623LP) 击倒', input: '623LP' },
    kd_rising_upper_medium_punch: { nameZh: '升腾上勾拳 (中拳) (623MP) 击倒', input: '623MP' },
    kd_rising_upper_heavy_punch: { nameZh: '升腾上勾拳 (重拳) (623HP) 击倒', input: '623HP' },
    kd_rising_upper_overdrive: { nameZh: '升腾上勾拳 (OD版) (623PP) 击倒', input: '623PP' },
    kd_slam_dunk_overdrive_rising_upper_followup: { nameZh: '强力扣杀 (623PP > PP) 击倒', input: '623PP > PP' },
    kd_avenger_no_chaser: { nameZh: '复仇冲刺 > 追击突进 (214K > P) 击倒', input: '214K > P' },
    kd_avenger_impaler: { nameZh: '复仇冲刺 > 刺穿重踢 (214K > K) 击倒', input: '214K > K' },
    kd_vulcan_blast_level_1: { nameZh: '火神爆弹 (SA1 / 236236P) 击倒', input: '236236P' },
    kd_eraser_level_2: { nameZh: '抹除连击 (SA2 / 214214P) 击倒', input: '214214P' },
    kd_pale_rider_level_3: { nameZh: '苍白骑士 (SA3/CA / 236236K) 击倒', input: '236236K' },
    kd_forward_throw: { nameZh: '前投 (6LP+LK) 击倒', input: '6LP+LK' },
    kd_back_throw: { nameZh: '后投 (4LP+LK) 击倒', input: '4LP+LK' },
  },
  chunli: {
    sweep_pc_chunli: { nameZh: '下重脚 确反破招 (2HK PC) 击倒', input: '2HK (PC)' },
    kd_swift_thrust: { nameZh: '疾风突刺 (4/6MP) 击倒', input: '4/6MP' },
    kd_hakkei: { nameZh: '发劲 (4HP) 击倒', input: '4HP' },
    kd_senpuukyaku: { nameZh: '旋风脚 (6HK) 击倒', input: '6HK' },
    kd_tenkukyaku: { nameZh: '天空脚 (4HK) 击倒', input: '4HK' },
    kd_yousoukyaku: { nameZh: '鹰爪脚 (j.2MK) 击倒', input: 'j.2MK' },
    kd_serenity_stream_medium_punch: { nameZh: '行云流水 > 蛇突手 (214P > MP) 击倒', input: '214P > MP' },
    kd_serenity_stream_heavy_kick: { nameZh: '行云流水 > 天空脚 (214P > HK) 击倒', input: '214P > HK' },
    kd_kikoken_overdrive: { nameZh: '气功拳 (OD版) ([4]~6PP) 击倒', input: '[4]~6PP' },
    kd_hundred_lightning_kicks_heavy_kick: { nameZh: '百裂脚 (重脚) (236HK) 击倒', input: '236HK' },
    kd_hundred_lightning_kicks_overdrive: { nameZh: '百裂脚 (OD版) (236KK) 击倒', input: '236KK' },
    kd_aerial_hundred_lightning_kicks_overdrive: { nameZh: '空中百裂脚 (OD版) (j.236KK) 击倒', input: 'j.236KK' },
    kd_spinning_bird_kick_medium_kick: { nameZh: '回旋鹤脚蹴 (中脚) ([2]~8MK) 击倒', input: '[2]~8MK' },
    kd_spinning_bird_kick_heavy_kick: { nameZh: '回旋鹤脚蹴 (重脚) ([2]~8HK) 击倒', input: '[2]~8HK' },
    kd_spinning_bird_kick_overdrive: { nameZh: '回旋鹤脚蹴 (OD版) ([2]~8KK) 击倒', input: '[2]~8KK' },
    kd_tensho_kicks_light_kick: { nameZh: '天升脚 (轻脚) (22LK) 击倒', input: '22LK' },
    kd_tensho_kicks_medium_kick: { nameZh: '天升脚 (中脚) (22MK) 击倒', input: '22MK' },
    kd_tensho_kicks_heavy_kick: { nameZh: '天升脚 (重脚) (22HK) 击倒', input: '22HK' },
    kd_tensho_kicks_overdrive: { nameZh: '天升脚 (OD版) (22KK) 击倒', input: '22KK' },
    kd_hazanshu_heavy_kick: { nameZh: '霸山蹴 (重脚) (214HK) 击倒', input: '214HK' },
    kd_hazanshu_overdrive: { nameZh: '霸山蹴 (OD版) (214KK) 击倒', input: '214KK' },
    kd_kikosho_level_1: { nameZh: '气功掌 (SA1 / 236236P) 击倒', input: '236236P' },
    kd_hoyoku_sen_level_2: { nameZh: '凤翼扇 (SA2 / 236236K) 击倒', input: '236236K' },
    kd_shoran_hokyaku_level_3: { nameZh: '苍天乱舞 (SA3/CA / 214214K) 击倒', input: '214214K' },
    kd_forward_throw: { nameZh: '前投 (6LP+LK) 击倒', input: '6LP+LK' },
    kd_back_throw: { nameZh: '后投 (4LP+LK) 击倒', input: '4LP+LK' },
  },
  cammy: {
    sweep_pc_cammy: { nameZh: '下重脚 确反破招 (2HK PC) 击倒', input: '2HK (PC)' },
    kd_forward_heavy_kick_delayed_ripper: { nameZh: '迟滞裂刃踢 (6HK) 击倒', input: '6HK' },
    kd_swing_combination_heavy_punch_heavy_kick: { nameZh: '摇摆连击 (5HP > 5HK) 击倒', input: '5HP > 5HK' },
    kd_spiral_arrow_light_kick: { nameZh: '螺旋箭 (轻脚) (236LK) 击倒', input: '236LK' },
    kd_spiral_arrow_medium_kick: { nameZh: '螺旋箭 (中脚) (236MK) 击倒', input: '236MK' },
    kd_spiral_arrow_heavy_kick: { nameZh: '螺旋箭 (重脚) (236HK) 击倒', input: '236HK' },
    kd_spiral_arrow_heavy_kick_full_charge: { nameZh: '螺旋箭 (重脚蓄力) (236HK[蓄]) 击倒', input: '236HK (hold)' },
    kd_spiral_arrow_overdrive: { nameZh: '螺旋箭 (OD版) (236KK) 击倒', input: '236KK' },
    kd_cannon_spike_light_kick: { nameZh: '加农尖刺 (轻脚) (623LK) 击倒', input: '623LK' },
    kd_cannon_spike_medium_kick: { nameZh: '加农尖刺 (中脚) (623MK) 击倒', input: '623MK' },
    kd_cannon_spike_heavy_kick: { nameZh: '加农尖刺 (重脚) (623HK) 击倒', input: '623HK' },
    kd_cannon_spike_heavy_kick_full_charge: { nameZh: '加农尖刺 (重脚蓄力) (623HK[蓄]) 击倒', input: '623HK (hold)' },
    kd_cannon_spike_overdrive: { nameZh: '加农尖刺 (OD版) (623KK) 击倒', input: '623KK' },
    kd_spin_knuckle_overdrive: { nameZh: '旋转重拳 (OD版) (214PP) 击倒', input: '214PP' },
    kd_hooligan_combination_razor_edge_slicer: { nameZh: '流氓绝杀 > 剃刀滑铲 (236P > 空过) 击倒', input: '236P > 空过' },
    kd_hooligan_combination_overdrive_razor_edge_slicer: { nameZh: '流氓绝杀 (OD版) > 剃刀滑铲 (236PP > 空过) 击倒', input: '236PP > 空过' },
    kd_hooligan_combination_cannon_strike: { nameZh: '流氓绝杀 > 加农空落 (236P > K) 击倒', input: '236P > K' },
    kd_hooligan_combination_overdrive_cannon_strike: { nameZh: '流氓绝杀 (OD版) > 加农空落 (236PP > K) 击倒', input: '236PP > K' },
    kd_hooligan_combination_fatal_leg_twister_throw: { nameZh: '流氓绝杀 > 致命剪刀脚 (236P > LP+LK) 击倒', input: '236P > LP+LK' },
    kd_hooligan_combination_overdrive_fatal_leg_twister_throw: { nameZh: '流氓绝杀 (OD版) > 致命剪刀脚 (236PP > LP+LK) 击倒', input: '236PP > LP+LK' },
    kd_spin_drive_smasher_level_1: { nameZh: '螺旋粉碎击 (SA1 / 236236K) 击倒', input: '236236K' },
    kd_killer_bee_spin_level_2: { nameZh: '杀人蜂旋转 (SA2 / 214214K) 击倒', input: '214214K' },
    kd_delta_red_assault_level_3: { nameZh: '三角红突击 (SA3/CA / 236236P) 击倒', input: '236236P' },
    kd_forward_throw: { nameZh: '前投 (6LP+LK) 击倒', input: '6LP+LK' },
    kd_back_throw: { nameZh: '后投 (4LP+LK) 击倒', input: '4LP+LK' },
  }
};

// Also general cleaner for all characters to clean up any remaining duplicated parens
function cleanGeneralKd(kd) {
  let nameZh = kd.nameZh || '';
  // Clean double parens: " (something) (something)"
  nameZh = nameZh.replace(/\s*\(([a-zA-Z\u4e00-\u9fa5\s,+-/>]+)\)\s*\(\1\)/g, ' ($1)');
  nameZh = nameZh.replace(/确反破招 \(2HK 确反破招 \(PC\)\)/g, '确反破招 (2HK PC)');
  nameZh = nameZh.replace(/确反破招 \(2HK\)/g, '确反破招 (2HK PC)');
  nameZh = nameZh.replace(/\s*\(Lv\.\d\s*\(SA(\d)\)\)/g, ' (SA$1)');
  nameZh = nameZh.replace(/\s*\(Lv\.\d\s*\/\s*CA\s*\(SA(\d)\)\)/g, ' (SA$1/CA)');
  nameZh = nameZh.replace(/\s*\(\s*\)/g, '');
  nameZh = nameZh.replace(/\s+/g, ' ').trim();
  return nameZh;
}

const files = fs.readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.ts') && f !== 'index.ts');

for (const file of files) {
  const charId = file.replace('.ts', '');
  const filePath = path.join(CHARACTERS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Parse knockdowns and apply fixes
  const charFixes = KD_FIXES[charId] || {};

  content = content.replace(/(\{\s*"id":\s*"([^"]+)",[\s\S]*?"tags":\s*\[[\s\S]*?\]\s*\})/g, (fullBlock, _p1, kdId) => {
    try {
      const kd = JSON.parse(fullBlock);
      if (charFixes[kdId]) {
        kd.nameZh = charFixes[kdId].nameZh;
        kd.input = charFixes[kdId].input;
      } else {
        kd.nameZh = cleanGeneralKd(kd);
      }
      return JSON.stringify(kd, null, 4);
    } catch {
      return fullBlock;
    }
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Fixed all character knockdowns cleanly.');
