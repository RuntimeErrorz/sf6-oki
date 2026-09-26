import fs from 'fs';
import path from 'path';

const dir = './src/data/characters';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  // Match any *4, *3, x4, x3, X4, X3, x 4, etc
  const matches = content.match(/["'][^"']*(?:x|\*)\s*\d+[^"']*["']/gi) || [];
  if (matches.length > 0) {
    console.log(file, matches);
  }
}
