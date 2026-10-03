import type { CharacterId, CharacterProfile } from '../../types';

// Launch 18 Characters (In-Game Official Select Screen Order)
import { lukeData } from './luke';
import { jamieData } from './jamie';
import { manonData } from './manon';
import { kimberlyData } from './kimberly';
import { marisaData } from './marisa';
import { lilyData } from './lily';
import { jpData } from './jp';
import { juriData } from './juri';
import { deejayData } from './deejay';
import { cammyData } from './cammy';
import { ryuData } from './ryu';
import { ehondaData } from './ehonda';
import { blankaData } from './blanka';
import { guileData } from './guile';
import { kenData } from './ken';
import { chunliData } from './chunli';
import { zangiefData } from './zangief';
import { dhalsimData } from './dhalsim';

// Year 1 DLC Characters (Release Order)
import { rashidData } from './rashid';
import { akiData } from './aki';
import { edData } from './ed';
import { akumaData } from './akuma';

// Year 2 DLC Characters (Release Order)
import { bisonData } from './bison';
import { terryData } from './terry';
import { maiData } from './mai';
import { elenaData } from './elena';

// Year 3 DLC Characters (Release Order)
import { sagatData } from './sagat';
import { viperData } from './viper';
import { alexData } from './alex';
import { ingridData } from './ingrid';

// Year 4 DLC Characters (Release Order)
import { yasmineData } from './yasmine';

/**
 * SF6 Official Character Order
 * 1. Base 18 Characters (Capcom Official Character Select Screen Order)
 * 2. Year 1 DLC (Rashid -> A.K.I. -> Ed -> Akuma)
 * 3. Year 2 DLC (M. Bison -> Terry -> Mai -> Elena)
 * 4. Year 3 DLC (Sagat -> C. Viper -> Alex -> Ingrid)
 * 5. Year 4 DLC (Yasmine)
 */
export const ALL_CHARACTERS: CharacterProfile[] = [
  // --- Launch 18 Base Roster ---
  lukeData,
  jamieData,
  manonData,
  kimberlyData,
  marisaData,
  lilyData,
  jpData,
  juriData,
  deejayData,
  cammyData,
  ryuData,
  ehondaData,
  blankaData,
  guileData,
  kenData,
  chunliData,
  zangiefData,
  dhalsimData,

  // --- Year 1 DLC ---
  rashidData,
  akiData,
  edData,
  akumaData,

  // --- Year 2 DLC ---
  bisonData,
  terryData,
  maiData,
  elenaData,

  // --- Year 3 DLC ---
  sagatData,
  viperData,
  alexData,
  ingridData,

  // --- Year 4 DLC ---
  yasmineData,
];

export const CHARACTER_MAP: Record<CharacterId, CharacterProfile> = {
  luke: lukeData,
  jamie: jamieData,
  manon: manonData,
  kimberly: kimberlyData,
  marisa: marisaData,
  lily: lilyData,
  jp: jpData,
  juri: juriData,
  deejay: deejayData,
  cammy: cammyData,
  ryu: ryuData,
  ehonda: ehondaData,
  blanka: blankaData,
  guile: guileData,
  ken: kenData,
  chunli: chunliData,
  zangief: zangiefData,
  dhalsim: dhalsimData,
  rashid: rashidData,
  aki: akiData,
  ed: edData,
  akuma: akumaData,
  bison: bisonData,
  terry: terryData,
  mai: maiData,
  elena: elenaData,
  sagat: sagatData,
  viper: viperData,
  alex: alexData,
  ingrid: ingridData,
  yasmine: yasmineData,
};

