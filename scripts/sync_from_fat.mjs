import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAT_RAW_DIR = path.join(__dirname, '..', 'src', 'data', 'fat_raw');
const CHARACTERS_DIR = path.join(__dirname, '..', 'src', 'data', 'characters');

/**
 * Standard input mapping helper between FAT numCmd and our character input definitions
 */
function normalizeInput(cmd) {
  if (!cmd) return '';
  return cmd.trim();
}

/**
 * Parses numeric values safely from FAT string/numbers (e.g. "11(14)" -> { base: 11, whiff: 14 })
 */
function parseFrameValue(val) {
  if (val === undefined || val === null) return { base: undefined, whiff: undefined };
  if (typeof val === 'number') return { base: val, whiff: undefined };
  const str = String(val).trim();
  const match = str.match(/^(-?\d+)(?:\((-?\d+)\))?/);
  if (match) {
    const base = parseInt(match[1], 10);
    const whiff = match[2] ? parseInt(match[2], 10) : undefined;
    return { base, whiff };
  }
  const directNum = parseInt(str, 10);
  return { base: isNaN(directNum) ? undefined : directNum, whiff: undefined };
}

/**
 * Perform synchronization across all 27 character files
 */
export function syncAllCharactersFromFAT() {
  console.log('================================================================');
  console.log('⚡ FAT (Frame Assistant Tool) Master Pipeline Synchronization');
  console.log('================================================================\n');

  if (!fs.existsSync(FAT_RAW_DIR)) {
    console.error(`FAT raw data directory not found at: ${FAT_RAW_DIR}`);
    return;
  }

  const rawFiles = fs.readdirSync(FAT_RAW_DIR).filter(f => f.endsWith('_sf6_fat.json'));
  let syncedCount = 0;

  for (const rawFile of rawFiles) {
    const charId = rawFile.replace('_sf6_fat.json', '');
    const charFilePath = path.join(CHARACTERS_DIR, `${charId}.ts`);

    if (!fs.existsSync(charFilePath)) {
      console.warn(`⚠️ Target character file not found for: ${charId}.ts`);
      continue;
    }

    const fatData = JSON.parse(fs.readFileSync(path.join(FAT_RAW_DIR, rawFile), 'utf8'));
    let tsContent = fs.readFileSync(charFilePath, 'utf8');

    console.log(`🔄 Syncing [${charId}] from live FAT raw database...`);

    const stats = fatData.stats || {};
    const normals = fatData.moves?.normal || {};

    // 1. Sync dashFrames
    const fDash = parseFrameValue(stats.fDash).base;
    if (fDash !== undefined) {
      tsContent = tsContent.replace(/dashFrames:\s*\d+/, `dashFrames: ${fDash}`);
      tsContent = tsContent.replace(/("id":\s*"dash_66"[\s\S]*?"totalFrames":\s*)\d+/, `$1${fDash}`);
      tsContent = tsContent.replace(/(id:\s*'dash_66'[\s\S]*?totalFrames:\s*)\d+/, `$1${fDash}`);
    }

    // 2. Sync backdashFrames
    const bDash = parseFrameValue(stats.bDash).base;
    if (bDash !== undefined) {
      tsContent = tsContent.replace(/backdashFrames:\s*\d+/, `backdashFrames: ${bDash}`);
      tsContent = tsContent.replace(/("id":\s*"backdash_44"[\s\S]*?"totalFrames":\s*)\d+/, `$1${bDash}`);
      tsContent = tsContent.replace(/(id:\s*'backdash_44'[\s\S]*?totalFrames:\s*)\d+/, `$1${bDash}`);
    }

    // 3. Sync jumpTotalFrames
    const nJump = parseFrameValue(stats.nJump).base;
    if (nJump !== undefined) {
      tsContent = tsContent.replace(/jumpTotalFrames:\s*\d+/, `jumpTotalFrames: ${nJump}`);
    }

    // 4. Sync Walk Speeds
    if (stats.fWalk) {
      const fWalk = parseFloat(stats.fWalk);
      if (!isNaN(fWalk)) {
        tsContent = tsContent.replace(/forwardWalkSpeed:\s*[\d.]+/, `forwardWalkSpeed: ${fWalk}`);
      }
    }
    if (stats.bWalk) {
      const bWalk = parseFloat(stats.bWalk);
      if (!isNaN(bWalk)) {
        tsContent = tsContent.replace(/backwardWalkSpeed:\s*[\d.]+/, `backwardWalkSpeed: ${bWalk}`);
      }
    }

    // 5. Index FAT normal moves by numCmd and name
    const fatMoveMap = new Map();
    for (const [mName, mData] of Object.entries(normals)) {
      if (mData.numCmd) {
        fatMoveMap.set(normalizeInput(mData.numCmd), mData);
      }
      fatMoveMap.set(normalizeInput(mName), mData);
    }

    // 6. Iterate and sync each normal move in character file
    const moveBlockRegex = /(\{[\s\S]*?input:\s*['"]([^'"]+)['"][\s\S]*?\})/g;

    tsContent = tsContent.replace(moveBlockRegex, (block, _p1, inputKey) => {
      const fatMove = fatMoveMap.get(inputKey) || fatMoveMap.get(normalizeInput(inputKey));
      if (!fatMove) return block;

      let updated = block;
      const startup = parseFrameValue(fatMove.startup).base;
      const active = parseFrameValue(fatMove.active).base;
      const recParsed = parseFrameValue(fatMove.recovery);
      const totalParsed = parseFrameValue(fatMove.total);
      const onBlock = parseFrameValue(fatMove.onBlock).base;
      const onHit = parseFrameValue(fatMove.onHit).base;

      if (startup !== undefined) {
        updated = updated.replace(/(\bstartup:\s*)\d+/, `$1${startup}`);
      }
      if (active !== undefined) {
        updated = updated.replace(/(\bactive:\s*)\d+/, `$1${active}`);
      }
      if (recParsed.base !== undefined) {
        updated = updated.replace(/(\brecovery:\s*)\d+/, `$1${recParsed.base}`);
      }
      if (recParsed.whiff !== undefined) {
        if (/recoveryWhiff:\s*\d+/.test(updated)) {
          updated = updated.replace(/(\brecoveryWhiff:\s*)\d+/, `$1${recParsed.whiff}`);
        } else {
          updated = updated.replace(/(\brecovery:\s*\d+,)/, `$1\n    recoveryWhiff: ${recParsed.whiff},`);
        }
      }
      if (totalParsed.base !== undefined) {
        updated = updated.replace(/(\btotal:\s*)\d+/, `$1${totalParsed.base}`);
      }
      if (totalParsed.whiff !== undefined) {
        if (/totalWhiff:\s*\d+/.test(updated)) {
          updated = updated.replace(/(\btotalWhiff:\s*)\d+/, `$1${totalParsed.whiff}`);
        }
      }
      if (onBlock !== undefined) {
        updated = updated.replace(/(\bonBlock:\s*)-?\d+/, `$1${onBlock}`);
      }
      if (onHit !== undefined) {
        updated = updated.replace(/(\bonHit:\s*)-?\d+/, `$1${onHit}`);
      }

      // Cancels: xx array
      if (fatMove.xx && Array.isArray(fatMove.xx)) {
        const isRapid = fatMove.xx.includes('ch');
        const isSpecial = fatMove.xx.includes('sp');

        if (/isRapidCancel:\s*(true|false)/.test(updated)) {
          updated = updated.replace(/isRapidCancel:\s*(true|false)/, `isRapidCancel: ${isRapid}`);
        }
        if (/isSpecialCancel:\s*(true|false)/.test(updated)) {
          updated = updated.replace(/isSpecialCancel:\s*(true|false)/, `isSpecialCancel: ${isSpecial}`);
        }
      }

      return updated;
    });

    // 7. Sync Sweep (2HK) knockdown advantage if available
    const sweepMove = fatMoveMap.get('2HK') || fatMoveMap.get('Crouch HK');
    if (sweepMove) {
      const kdHitStr = String(sweepMove.onHit || '');
      const kdPcStr = String(sweepMove.onPC || '');
      const kdHitMatch = kdHitStr.match(/(?:KD|HKD)\s*\+?(-?\d+)/);
      const kdPcMatch = kdPcStr.match(/(?:KD|HKD)\s*\+?(-?\d+)/);
      if (kdHitMatch) {
        const kdVal = parseInt(kdHitMatch[1], 10);
        tsContent = tsContent.replace(/("id":\s*"kd_crouching_heavy_kick"[\s\S]*?"adv":\s*)\d+/, `$1${kdVal}`);
        tsContent = tsContent.replace(/(id:\s*'kd_crouching_heavy_kick'[\s\S]*?adv:\s*)\d+/, `$1${kdVal}`);
      }
      if (kdPcMatch) {
        const pcVal = parseInt(kdPcMatch[1], 10);
        tsContent = tsContent.replace(/("id":\s*"sweep_pc_[^"]*"[\s\S]*?"adv":\s*)\d+/, `$1${pcVal}`);
        tsContent = tsContent.replace(/(id:\s*'sweep_pc_[^']*'[\s\S]*?adv:\s*)\d+/, `$1${pcVal}`);
      }
    }

    fs.writeFileSync(charFilePath, tsContent, 'utf8');
    console.log(`   ✅ [${charId}] Successfully synchronized with live FAT dataset.`);
    syncedCount++;
  }

  console.log('\n================================================================');
  console.log(`🎉 Pipeline Synchronization Complete: ${syncedCount} / ${rawFiles.length} characters updated.`);
  console.log('================================================================\n');
}

// Execute sync
syncAllCharactersFromFAT();
