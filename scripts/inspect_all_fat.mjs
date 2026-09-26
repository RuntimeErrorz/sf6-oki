import fs from 'fs';
import path from 'path';

const FAT_RAW_DIR = 'src/data/fat_raw';
const files = fs.readdirSync(FAT_RAW_DIR).filter(f => f.endsWith('_sf6_fat.json'));

const allMoves = new Map();

for (const file of files) {
  const charId = file.replace('_sf6_fat.json', '');
  const data = JSON.parse(fs.readFileSync(path.join(FAT_RAW_DIR, file), 'utf8'));
  const moves = data.moves?.normal || {};
  const list = [];
  for (const [k, v] of Object.entries(moves)) {
    list.push({ key: k, numCmd: v.numCmd, name: v.moveName });
  }
  allMoves.set(charId, list);
}

console.log('Loaded FAT data for', allMoves.size, 'characters');
