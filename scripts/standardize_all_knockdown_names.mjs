import fs from 'fs';
import path from 'path';

const CHARACTERS_DIR = 'src/data/characters';
const files = fs.readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.ts') && f !== 'index.ts');

for (const file of files) {
  const filePath = path.join(CHARACTERS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/(\{\s*"id":\s*"([^"]+)",[\s\S]*?"tags":\s*\[[\s\S]*?\]\s*\})/g, (fullBlock) => {
    try {
      const kd = JSON.parse(fullBlock);
      let nameZh = kd.nameZh || '';
      const input = kd.input || '';

      // Strip "击倒" suffix
      nameZh = nameZh.replace(/\s*击倒\s*$/g, '').trim();

      // Remove duplicate parens if any
      nameZh = nameZh.replace(/\s*\([^)]*\)\s*\([^)]*\)$/, (match) => {
        // e.g. " (OD版) (214PP)" -> keep both if first is OD/variant and second is input
        if (match.includes('OD') || match.includes('轻') || match.includes('中') || match.includes('重') || match.includes('SA') || match.includes('CA')) {
          return match;
        }
        return '';
      });

      // If nameZh ends with a duplicate of the move name, e.g. "音速刀刃 (OD版) (音速刀刃)", fix to "音速刀刃 (OD版) (214PP)"
      nameZh = nameZh.replace(/\s*\(([\u4e00-\u9fa5]+)\)$/, (_m, p1) => {
        if (p1.includes('轻') || p1.includes('中') || p1.includes('重') || p1.includes('OD') || p1.includes('SA') || p1.includes('CA') || p1.includes('PC')) {
          return ` (${p1})`;
        }
        return '';
      });

      // If input is not already in nameZh, add it
      if (!nameZh.includes(input) && input) {
        nameZh = `${nameZh} (${input})`;
      }

      // Add clean " 击倒"
      nameZh = `${nameZh} 击倒`;

      // Clean duplicate spaces
      nameZh = nameZh.replace(/\s+/g, ' ').trim();

      kd.nameZh = nameZh;
      return JSON.stringify(kd, null, 4);
    } catch {
      return fullBlock;
    }
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Standardized all knockdown names across 27 characters.');
