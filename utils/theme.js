const { EmbedBuilder } = require('discord.js');
const crypto = require('crypto');

const LOGO = () => 'https://i.imgur.com/X9kcsx0.png';
const PURPLE = 0x7C4DFF;

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

function em(title, desc, fields) {
  const logo = LOGO();
  const embed = new EmbedBuilder()
    .setColor(PURPLE)
    .setTimestamp()
    .setFooter({ text: 'KONVAULT™', iconURL: logo });
  if (title) embed.setTitle(title);
  if (desc) embed.setDescription(desc);
  if (logo) embed.setThumbnail(logo);
  if (fields?.length) embed.addFields(fields);
  return embed;
}

const wait = ms => new Promise(r => setTimeout(r, ms));

module.exports = { em, wait, hmacRoll, hmacFloat, hmacFloat2, pick, secureShuffle, PURPLE };
