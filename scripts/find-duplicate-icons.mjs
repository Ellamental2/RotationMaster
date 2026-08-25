import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';

const abilities = JSON.parse(fs.readFileSync('src/assets/abilities.json', 'utf8'));
const iconsDir = 'src/assets/resource/abilities';

function hashFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
}

function iconPath(ability) {
  const fromSrc = ability.Src?.replace('./assets/resource/abilities/', '') || `${ability.Title}.webp`;
  return path.join(iconsDir, fromSrc);
}

const byHash = new Map();
const missing = [];

for (const ability of abilities) {
  const file = iconPath(ability);
  const hash = hashFile(file);
  if (!hash) {
    missing.push(ability.Title);
    continue;
  }
  if (!byHash.has(hash)) byHash.set(hash, []);
  byHash.get(hash).push({
    title: ability.Title,
    emoji: ability.Emoji,
    emojiId: String(ability.EmojiId),
    file: path.basename(file),
    bytes: fs.statSync(file).size
  });
}

const duplicateGroups = [...byHash.values()]
  .filter(group => {
    const ids = new Set(group.map(g => g.emojiId));
    return group.length > 1 && ids.size > 1;
  })
  .sort((a, b) => b.length - a.length);

console.log(JSON.stringify({
  abilities: abilities.length,
  uniqueFiles: byHash.size,
  missingFiles: missing,
  duplicateGroups: duplicateGroups.length,
  duplicates: duplicateGroups.map(group => ({
    hash: crypto.createHash('md5').update(group.map(g => g.emojiId).join(',')).digest('hex').slice(0, 8),
    count: group.length,
    items: group
  }))
}, null, 2));
