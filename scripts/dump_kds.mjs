import fs from 'fs';
import path from 'path';

const dir = 'src/data/characters';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

const allKds = {};

for (const file of files) {
  const charId = file.replace('.ts', '');
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const kdMatches = content.match(/{\s*"id":\s*"[^"]+",[\s\S]*?"tags":\s*\[[\s\S]*?\]\s*}/g) || [];
  
  allKds[charId] = [];
  for (const kdStr of kdMatches) {
    try {
      const kd = JSON.parse(kdStr);
      allKds[charId].push(kd);
    } catch {}
  }
}

fs.writeFileSync('scripts/all_kds_dump.json', JSON.stringify(allKds, null, 2), 'utf8');
console.log('Dumped all character knockdowns to scripts/all_kds_dump.json');
