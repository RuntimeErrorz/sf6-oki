import fs from 'fs';
import path from 'path';

const dir = 'src/data/characters';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  
  // Extract knockdowns
  const kdMatches = content.match(/{\s*"id":\s*"[^"]+",[\s\S]*?"tags":\s*\[[\s\S]*?\]\s*}/g) || [];
  const messyKds = [];
  for (const kdStr of kdMatches) {
    try {
      const kd = JSON.parse(kdStr);
      const nameZh = kd.nameZh || '';
      // Check if nameZh has messy English remnants
      const cleaned = nameZh
        .replace(/\b(SA1|SA2|SA3|OD|PC|DP|LP|MP|HP|LK|MK|HK|PP|KK|DI|DR|CA|Lv\.\d|TC|PC|KD)\b/gi, '')
        .replace(/j\.|st\.|cr\./gi, '');
      if (/[a-zA-Z]{3,}/.test(cleaned) || /Down|Jump|Medium|Punch|Kick|Forward|Back/.test(nameZh)) {
        messyKds.push({ id: kd.id, nameZh: kd.nameZh, input: kd.input });
      }
    } catch {}
  }

  if (messyKds.length > 0) {
    console.log(`\n================= ${file} (${messyKds.length} messy KDs) =================`);
    messyKds.forEach(k => console.log(`  [${k.id}] input: "${k.input}" | nameZh: "${k.nameZh}"`));
  }
}
