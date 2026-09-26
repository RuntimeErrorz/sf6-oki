import fs from 'fs';
import path from 'path';

const dir = 'src/data/characters';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

const issues = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const kdMatches = content.match(/{\s*"id":\s*"[^"]+",[\s\S]*?"tags":\s*\[[\s\S]*?\]\s*}/g) || [];
  
  for (const kdStr of kdMatches) {
    try {
      const kd = JSON.parse(kdStr);
      const name = kd.nameZh || '';
      if (name.includes(',') || name.includes('，') || name.includes(' + ') || name.includes('下-前') || name.includes('下-后')) {
        issues.push({ file, id: kd.id, input: kd.input, nameZh: name });
      }
    } catch {}
  }
}

console.log(`Found ${issues.length} knockdowns with raw commas or +/- symbols:`);
issues.forEach(i => console.log(`[${i.file}] id: "${i.id}" | input: "${i.input}" | nameZh: "${i.nameZh}"`));
