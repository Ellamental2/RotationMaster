import fs from 'fs';
import path from 'path';
import https from 'https';

const githubPath = process.argv[2];
const github = JSON.parse(fs.readFileSync(githubPath, 'utf8'));
const abilitiesPath = 'src/assets/abilities.json';
const abilities = JSON.parse(fs.readFileSync(abilitiesPath, 'utf8'));
const iconsDir = 'src/assets/resource/abilities';

const skipCategories = new Set(['uncategorized', 'uncategorised', 'Uncategorised']);

function flatten(pvme) {
  const out = [];
  for (const cat of pvme.categories || []) {
    for (const e of cat.emojis || []) {
      out.push({ ...e, category: cat.name });
    }
  }
  return out;
}

const emojis = flatten(github);
const byTitle = new Set(abilities.map(a => a.Title.toLowerCase()));
const byEmojiId = new Set(abilities.map(a => String(a.EmojiId)));

const toAdd = [];
for (const e of emojis) {
  if (!e.id || !e.emoji_id) continue;
  if (skipCategories.has(e.category)) continue;
  if (byTitle.has(e.id.toLowerCase()) || byEmojiId.has(String(e.emoji_id))) continue;
  toAdd.push(e);
  byTitle.add(e.id.toLowerCase());
  byEmojiId.add(String(e.emoji_id));
}

console.log('to add', toAdd.length);
console.log(toAdd.map(e => `${e.category} | ${e.id} | ${e.name}`).join('\n'));

fs.writeFileSync('src/assets/pvme.json', JSON.stringify(github, null, 4));

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
        reject(new Error(`HTTP ${res.statusCode} ${url}`));
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
      if (buf.length > 50) return { buf, url };
    } catch {
      // try next format
    }
  }
  return null;
}

const added = [];
const failed = [];

for (const e of toAdd) {
  const dest = path.join(iconsDir, `${e.id}.webp`);
  if (!fs.existsSync(dest)) {
    const icon = await fetchIcon(e.emoji_id);
    if (!icon) {
      failed.push({ id: e.id, emoji_id: e.emoji_id, name: e.name });
      continue;
    }
    fs.writeFileSync(dest, icon.buf);
  }

  abilities.push({
    Title: e.id,
    Src: `./assets/resource/abilities/${e.id}.webp`,
    Emoji: e.name,
    EmojiId: String(e.emoji_id),
    Category: e.category
  });
  added.push(e.id);
}

fs.writeFileSync(abilitiesPath, JSON.stringify(abilities, null, 2) + '\n');
console.log(JSON.stringify({ added: added.length, failed, addedIds: added }, null, 2));
