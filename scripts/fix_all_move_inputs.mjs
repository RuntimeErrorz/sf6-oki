import fs from 'fs';
import path from 'path';

const CHARACTERS_DIR = 'src/data/characters';

const INPUT_REPLACEMENTS = [
  // A.K.I.
  ['Forward Jump, Down + Heavy Punch', 'j.2HP'],
  ['Entrapment', '214K > P'],

  // Akuma
  ['Forward Jump, Down + Medium Kick', 'j.2MK'],

  // Blanka
  ['6 or 3KKK', '6KK'],
  ['4 or 1KKK', '4KK'],

  // Cammy
  ['236P > LPLK', '236P > LP+LK'],

  // Chun-Li
  ['9 during jump near wall', 'j.9 (墙跳)'],

  // Dhalsim
  ['Down-Back + Light Kick', '1LK'],
  ['Jump, Down + Light Punch', 'j.2LP'],
  ['Jump, Down + K', 'j.2K'],
  ['236K (Arch)', '236K'],
  ['236KK (Arch)', '236KK'],
  ['4 or 6PPP or KKK', '6PPP / 4PPP'],

  // E. Honda
  ['Forward Jump, Down + Medium Kick', 'j.2MK'],

  // Guile
  ['Back + Light Kick', '4LK'],

  // Jamie
  ['Freeflow Strikes > Kick Followup 1', '236P > 6K'],
  ['Freeflow Strikes > Kick Followup 2', '236P > 6K > 6K'],

  // Juri
  ['236LKMK', '236KK'],
  ['236LKHK', '236KK'],
  ['236MKHK', '236KK'],

  // Kimberly
  ['Jump, Down + Medium Punch', 'j.2MP'],
  ['Bushin Izuna Otoshi', '236K > P'],
  ['Shadow Slide', '236K > 2K'],

  // Lily
  ['8 or 9PPP', 'j.PP'],
  ['Jump, Down + Heavy Punch', 'j.2HP'],
  ['Mexican Typhoon', '360P'],

  // Rashid
  ['Run > Forward + Punch', '66 > 6P'],
  ['Run > Forward + Kick', '66 > 6K'],
  ['9 (near wall)', 'j.9 (墙跳)'],
  ['Forward Jump, Down + Heavy Punch', 'j.2HP'],
  ['Neutral Jump, Up + Heavy Kick', 'j.8HK'],

  // Terry
  ['214LPMP or LPHP', '214PP'],
  ['214MPHP', '214PP'],

  // Zangief
  ['Jump, Down + Heavy Punch', 'j.2HP'],
];

const files = fs.readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.ts') && f !== 'index.ts');

for (const file of files) {
  const filePath = path.join(CHARACTERS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');

  for (const [raw, repl] of INPUT_REPLACEMENTS) {
    // Replace in input field: "input": "..."
    content = content.replaceAll(`"input": "${raw}"`, `"input": "${repl}"`);
    content = content.replaceAll(`input: '${raw}'`, `input: '${repl}'`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Fixed non-standard move and knockdown inputs.');
