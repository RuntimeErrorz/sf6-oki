import fs from 'fs';
import path from 'path';

const dir = 'src/data/characters';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const kdMatches = content.match(/{\s*"id":\s*"[^"]+",[\s\S]*?"tags":\s*\[[\s\S]*?\]\s*}/g) || [];
  
  console.log(`\n=================== ${file} ===================`);
  for (const kdStr of kdMatches) {
    try {
      const kd = JSON.parse(kdStr);
      console.log(`  [+${kd.adv}f] input: "${kd.input}" | nameZh: "${kd.nameZh}"`);
    } catch {}
  }
}
