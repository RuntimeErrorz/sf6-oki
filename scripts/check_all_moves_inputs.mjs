import fs from 'fs';
import path from 'path';

const dir = 'src/data/characters';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

const suspiciousMoves = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  // Match moves array objects
  const moveRegex = /\{[^{}]*"id":\s*"([^"]+)",[^{}]*"input":\s*"([^"]+)"[^{}]*\}/g;
  let match;
  while ((match = moveRegex.exec(content)) !== null) {
    const id = match[1];
    const input = match[2];
    if (/[a-zA-Z]{3,}/.test(input.replace(/\b(hold|air|counter|max|lvl|bad|good|great|cancel|only|far|close|dash|feint)\b/gi, ''))) {
      suspiciousMoves.push({ file, id, input });
    }
  }
}

console.log(`Found ${suspiciousMoves.length} suspicious move inputs:`);
suspiciousMoves.forEach(s => console.log(`[${s.file}] id: "${s.id}" | input: "${s.input}"`));
