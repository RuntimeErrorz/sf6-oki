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

      // Strip "击倒"
      nameZh = nameZh.replace(/\s*击倒\s*$/g, '').trim();

      // Replace duplicate patterns like " (2HK PC) (2HK (PC))" -> " (2HK PC)"
      nameZh = nameZh.replace(/\s*\(2HK PC\)\s*\(2HK\s*\(PC\)\)/g, ' (2HK PC)');
      nameZh = nameZh.replace(/\s*\(([a-zA-Z0-9~[\]\s><·/+-]+)\)\s*\(\1\)/g, ' ($1)');

      // If nameZh ends with duplicate parens where one is redundant
      // e.g. " (SA1) (236236K)" -> " (SA1 / 236236K)"
      nameZh = nameZh.replace(/\s*\(SA(\d)\)\s*\(([^)]+)\)/g, ' (SA$1 / $2)');
      nameZh = nameZh.replace(/\s*\(SA(\d)\/CA\)\s*\(([^)]+)\)/g, ' (SA$1/CA / $2)');
      nameZh = nameZh.replace(/\s*\(OD版\)\s*\(([^)]+)\)/g, ' (OD版) ($1)');

      nameZh = `${nameZh} 击倒`;
      nameZh = nameZh.replace(/\s+/g, ' ').trim();

      kd.nameZh = nameZh;
      return JSON.stringify(kd, null, 4);
    } catch {
      return fullBlock;
    }
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Cleaned double parens across all 27 character files.');
