import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FAT_RAW_DIR = path.join(__dirname, '..', 'src', 'data', 'fat_raw');

if (!fs.existsSync(FAT_RAW_DIR)) {
  fs.mkdirSync(FAT_RAW_DIR, { recursive: true });
}

// Map of charId to SF6 hashtag and character name in FAT
const CHARACTER_MAPPINGS = {
  aki: { hashtag: '#SF6_AKI', name: 'A.K.I.' },
  akuma: { hashtag: '#SF6_AKUMA', name: 'Akuma' },
  bison: { hashtag: '#SF6_MBISON', name: 'M. Bison' },
  blanka: { hashtag: '#SF6_BLANKA', name: 'Blanka' },
  cammy: { hashtag: '#SF6_CAMMY', name: 'Cammy' },
  chunli: { hashtag: '#SF6_CHUNLI', name: 'Chun-Li' },
  deejay: { hashtag: '#SF6_DEEJAY', name: 'Dee Jay' },
  dhalsim: { hashtag: '#SF6_DHALSIM', name: 'Dhalsim' },
  ed: { hashtag: '#SF6_ED', name: 'Ed' },
  ehonda: { hashtag: '#SF6_EHONDA', name: 'E. Honda' },
  elena: { hashtag: '#SF6_ELENA', name: 'Elena' },
  guile: { hashtag: '#SF6_GUILE', name: 'Guile' },
  jamie: { hashtag: '#SF6_JAMIE', name: 'Jamie' },
  jp: { hashtag: '#SF6_JP', name: 'JP' },
  juri: { hashtag: '#SF6_JURI', name: 'Juri' },
  ken: { hashtag: '#SF6_KEN', name: 'Ken' },
  kimberly: { hashtag: '#SF6_KIMBERLY', name: 'Kimberly' },
  lily: { hashtag: '#SF6_LILY', name: 'Lily' },
  luke: { hashtag: '#SF6_LUKE', name: 'Luke' },
  mai: { hashtag: '#SF6_MAI', name: 'Mai' },
  manon: { hashtag: '#SF6_MANON', name: 'Manon' },
  marisa: { hashtag: '#SF6_MARISA', name: 'Marisa' },
  rashid: { hashtag: '#SF6_RASHID', name: 'Rashid' },
  ryu: { hashtag: '#SF6_RYU', name: 'Ryu' },
  terry: { hashtag: '#SF6_TERRY', name: 'Terry' },
  yasmine: { hashtag: '#SF6_YASMINE', name: 'Yasmine' },
  zangief: { hashtag: '#SF6_ZANGIEF', name: 'Zangief' },
};

function sanitizeJson(raw) {
  return raw
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\'/g, "'")
    .replace(/\\\\"/g, '\\"');
}

function extractMatchingBraces(str, startIndex) {
  let depth = 0;
  let inString = false;
  let escape = false;
  let stringChar = '';

  for (let i = startIndex; i < str.length; i++) {
    const char = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (inString) {
      if (char === stringChar) {
        inString = false;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      continue;
    }
    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        return str.slice(startIndex, i + 1);
      }
    }
  }
  return '';
}

async function scrapeAll() {
  console.log('Fetching FAT Online master bundle...');
  const res = await fetch('https://fullmeter.com/fatonline/static/js/main.d4c6003e.js');
  const bundle = await res.text();
  console.log('Fetched bundle size:', bundle.length);

  let successCount = 0;

  for (const [charId, info] of Object.entries(CHARACTER_MAPPINGS)) {
    const hashIdx = bundle.indexOf(`"${info.hashtag}"`);
    if (hashIdx === -1) {
      console.warn(`❌ Hashtag not found for ${charId}: ${info.hashtag}`);
      continue;
    }

    // In FAT bundle, hashtag is at the end of stats block inside the character object
    // Scan backward to find the character's root `"moves":{"normal":` or start
    // Let's find the character start by looking backwards from hashIdx
    const movesIdx = bundle.lastIndexOf('{"moves":', hashIdx);
    if (movesIdx === -1) {
      console.warn(`❌ Moves start not found for ${charId}`);
      continue;
    }

    const charRaw = extractMatchingBraces(bundle, movesIdx);
    if (!charRaw) {
      console.warn(`❌ Failed to extract braces for ${charId}`);
      continue;
    }

    const clean = sanitizeJson(charRaw);
    try {
      const parsed = JSON.parse(clean);
      const outPath = path.join(FAT_RAW_DIR, `${charId}_sf6_fat.json`);
      fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2), 'utf8');
      const normalCount = Object.keys(parsed.moves?.normal || {}).length;
      const specialCount = Object.keys(parsed.moves?.special || {}).length;
      console.log(`✅ [${charId}] Extracted ${info.name} (${normalCount} normals, ${specialCount} specials)`);
      successCount++;
    } catch (e) {
      console.error(`❌ Parse error for [${charId}]:`, e.message);
      fs.writeFileSync(path.join(FAT_RAW_DIR, `${charId}_sf6_fat_raw.js`), charRaw, 'utf8');
    }
  }

  console.log(`\n🎉 Total characters extracted from FAT Online: ${successCount} / ${Object.keys(CHARACTER_MAPPINGS).length}`);
}

scrapeAll().catch(console.error);
