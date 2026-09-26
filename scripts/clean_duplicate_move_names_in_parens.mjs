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
      
      // Clean duplicate move name inside parentheses, e.g. "音速刀刃 (OD版) (音速刀刃)" -> "音速刀刃 (OD版) (214PP)"
      nameZh = nameZh.replace(/\s*\([\u4e00-\u9fa5a-zA-Z\s·]+\)$/, '');
      // If nameZh doesn't end with input in parens, add standard (input)
      if (!nameZh.includes(kd.input) && !nameZh.endsWith(')')) {
        nameZh = `${nameZh} (${kd.input})`;
      } else if (!nameZh.includes(kd.input) && nameZh.endsWith(')')) {
        nameZh = `${nameZh} (${kd.input})`;
      }

      // Ensure "击倒" suffix is clean
      if (!nameZh.endsWith('击倒')) {
        nameZh = `${nameZh} 击倒`;
      }

      kd.nameZh = nameZh;
      return JSON.stringify(kd, null, 4);
    } catch {
      return fullBlock;
    }
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Cleaned duplicate move names in parens across all characters.');
