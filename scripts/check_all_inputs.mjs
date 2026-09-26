import fs from 'fs';
import path from 'path';

const dir = 'src/data/characters';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

const suspiciousInputs = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const kdMatches = content.match(/{\s*"id":\s*"[^"]+",[\s\S]*?"tags":\s*\[[\s\S]*?\]\s*}/g) || [];
  
  for (const kdStr of kdMatches) {
    try {
      const kd = JSON.parse(kdStr);
      const input = kd.input || '';
      // Check for raw words like "Heavy", "Medium", "Punch", "Kick", "Down", "Forward", "Jump" in input
      if (/[a-zA-Z]{3,}/.test(input.replace(/\b(hold|air|counter|max|lvl|bad|good|great|cancel)\b/gi, ''))) {
        suspiciousInputs.push({ file, id: kd.id, input: kd.input, nameZh: kd.nameZh });
      }
    } catch {}
  }
}

console.log(`Found ${suspiciousInputs.length} suspicious knockdown inputs:`);
suspiciousInputs.forEach(s => console.log(`[${s.file}] id: "${s.id}" | input: "${s.input}" | nameZh: "${s.nameZh}"`));
