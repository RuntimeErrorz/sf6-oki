import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/all_kds_dump.json', 'utf8'));

for (const [charId, kds] of Object.entries(data)) {
  const bad = [];
  for (const kd of kds) {
    const name = kd.nameZh || '';
    // Check if name has multiple parentheses or literal "+" or commas or duplicated substrings
    if (/\([^)]+\)\s*\([^)]+\)/.test(name) || name.includes('+') || name.includes('，') || name.includes(',') || /\([^)]*\([^)]*\)[^)]*\)/.test(name)) {
      bad.push(kd);
    }
  }
  if (bad.length > 0) {
    console.log(`\n=== ${charId} (${bad.length} messy names) ===`);
    bad.forEach(b => console.log(`  id: "${b.id}" | input: "${b.input}" | nameZh: "${b.nameZh}"`));
  }
}
