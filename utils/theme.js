const { EmbedBuilder } = require('discord.js');
const crypto = require('crypto');

const PURPLE = 0x7C4DFF;

const IMAGES = {
  logo:        'https://i.imgur.com/mqljyFE.png',
  tower:       'https://i.imgur.com/3VJ0e1M.png',
  price:       'https://i.imgur.com/9EijdXJ.png',
  verify:      'https://i.imgur.com/ww31ogR.png',
  dice:        'https://i.imgur.com/9FOoGmz.png',
  coinflip:    'https://i.imgur.com/2XiD1YT.png',
  limbo:       'https://i.imgur.com/52P2XS1.png',
  crash:       'https://i.imgur.com/fSoIgTJ.png',
  slots:       'https://i.imgur.com/ziYBD1H.png',
  highcard:    'https://i.imgur.com/T1M3EWF.png',
  roulette:    'https://i.imgur.com/FUXpfzI.png',
  scratch:     'https://i.imgur.com/2uRTYsX.png',
  russian:     'https://i.imgur.com/UrvNpfH.png',
  rps:         'https://i.imgur.com/FX6sOoi.png',
  blackjack:   'https://i.imgur.com/e6pyB5B.png',
  highlow:     'https://i.imgur.com/fAZ7Eww.png',
  win:         'https://i.imgur.com/bolkA2N.png',
  loss:        'https://i.imgur.com/iZBVhvE.png',
  jackpot:     'https://i.imgur.com/XppMuny.png',
  balance:     'https://i.imgur.com/YqUKx2r.png',
  solbalance:  'https://i.imgur.com/OuKxmBY.png',
  gamechannel: 'https://i.imgur.com/csXKUK6.png',
};

function em(title, desc, fields, imageKey) {
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTimestamp()
    .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo });
  if (title) embed.setTitle(title);
  if (desc) embed.setDescription(desc);
  embed.setThumbnail(IMAGES.logo);
  if (fields?.length) embed.addFields(fields);
  if (imageKey && IMAGES[imageKey]) embed.setImage(IMAGES[imageKey]);
  return embed;
}

function hmacRoll(min, max) {
  const range = max - min + 1;
  const bitsNeeded = Math.ceil(Math.log2(range));
  const bytesNeeded = Math.ceil(bitsNeeded / 8);
  const mask = Math.pow(2, bitsNeeded) - 1;
  let value;
  do {
    const buf = crypto.randomBytes(bytesNeeded);
    value = 0;
    for (let i = 0; i < bytesNeeded; i++) value = (value << 8) | buf[i];
    value = value & mask;
  } while (value >= range);
  return min + value;
}

function hmacFloat() {
  const key = crypto.randomBytes(64);
  const data = crypto.randomBytes(64);
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(data);
  const digest = hmac.digest();
  let val = 0;
  for (let i = 0; i < 7; i++) val = val * 256 + digest[i];
  return val / Math.pow(256, 7);
}

function hmacFloat2(min, max, dp = 2) {
  return parseFloat((hmacFloat() * (max - min) + min).toFixed(dp));
}

function pick(arr) { return arr[hmacRoll(0, arr.length - 1)]; }

function secureShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = hmacRoll(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateFairRoll(min, max) {
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const clientSeed = crypto.randomBytes(16).toString('hex');
  const nonce = Date.now();
  const hmac = crypto.createHmac('sha256', serverSeed);
  hmac.update(clientSeed + ':' + nonce);
  const digest = hmac.digest('hex');
  const rawNum = parseInt(digest.slice(0, 8), 16);
  const range = max - min + 1;
  const result = min + (rawNum % range);
  const commitment = crypto.createHash('sha256').update(serverSeed).digest('hex');
  return { result, serverSeed, clientSeed, nonce, commitment, digest };
}

const wait = ms => new Promise(r => setTimeout(r, ms));

module.exports = { em, wait, hmacRoll, hmacFloat, hmacFloat2, pick, secureShuffle, generateFairRoll, PURPLE, IMAGES };
