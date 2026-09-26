import fs from 'fs';
import path from 'path';

const dir = 'src/data/characters';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

const summary = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const regex = /["']?nameZh["']?\s*:\s*["']([^"']+)["']/g;
  let match;
  const list = [];
  while ((match = regex.exec(content)) !== null) {
    const val = match[1];
    const cleaned = val
      .replace(/\b(SA1|SA2|SA3|OD|PC|DP|LP|MP|HP|LK|MK|HK|PP|KK|DI|DR|CA|Lv\.\d|TC|Whiff|Hold|Punish|Counter|Jump|Neutral|Forward|Back|Down|Crouch|Stand|DDT)\b/gi, '')
      .replace(/j\.|st\.|cr\./gi, '');
    if (/[a-zA-Z]{3,}/.test(cleaned)) {
      list.push(val);
    }
  }
  summary.push({ file, count: list.length, list });
}

let totalIssues = 0;
for (const s of summary) {
  console.log(`${s.file}: ${s.count} issues`);
  totalIssues += s.count;
  if (s.count > 0) {
    s.list.forEach(item => console.log(`   - ${item}`));
  }
}
console.log(`\nTotal remaining issues across all 27 characters: ${totalIssues}`);
