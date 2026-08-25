import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';

const abilities = JSON.parse(fs.readFileSync('src/assets/abilities.json', 'utf8'));
const iconsDir = 'src/assets/resource/abilities';

function hashBuf(buf) {
  return crypto.createHash('md5').update(buf).digest('hex');
}

function iconPath(ability) {
  const fromSrc = ability.Src?.replace('./assets/resource/abilities/', '') || `${ability.Title}.webp`;
  return path.join(iconsDir, fromSrc);
}

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'RotationMaster-icon-sync' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        download(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function fetchIcon(emojiId) {
  const urls = [
    `https://cdn.discordapp.com/emojis/${emojiId}.webp?size=64&quality=lossless`,
    `https://cdn.discordapp.com/emojis/${emojiId}.png?size=64`,
    `https://cdn.discordapp.com/emojis/${emojiId}.gif?size=64`
  ];
  for (const url of urls) {
    try {
      const buf = await download(url);
      if (buf.length > 50) return buf;
    } catch {
      // try next
    }
  }
  return null;
}

const COMBAT_SNOWFLAKE = 1470000000000000000n;
const targets = abilities.filter(a => {
  if (!/^\d+$/.test(String(a.EmojiId))) return false;
  const id = BigInt(a.EmojiId);
  const title = a.Title || '';
  const isOld = /^old/i.test(title);
  return !isOld && id >= COMBAT_SNOWFLAKE;
});

console.log('redownloading', targets.length, 'post-combat icons');

const changed = [];
const unchanged = [];
const failed = [];

for (const ability of targets) {
  const dest = iconPath(ability);
  const before = fs.existsSync(dest) ? hashBuf(fs.readFileSync(dest)) : null;
  const buf = await fetchIcon(ability.EmojiId);
  if (!buf) {
    failed.push(ability.Title);
    continue;
  }
  const after = hashBuf(buf);
  fs.writeFileSync(dest, buf);
  if (before !== after) {
    changed.push({ title: ability.Title, emoji: ability.Emoji, bytes: buf.length });
  } else {
    unchanged.push(ability.Title);
  }
}

console.log(JSON.stringify({ changed: changed.length, unchanged: unchanged.length, failed, changedItems: changed }, null, 2));
