const { EmbedBuilder } = require('discord.js');
const crypto = require('crypto');

const LOGO = () => process.env.LOGO_URL || null;
const PURPLE = 0x7C4DFF;

function hmacRoll(min, max) {
  const range = max - min + 1;
  const key = crypto.randomBytes(64);
  const data = crypto.randomBytes(64);
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(data);
  const digest = hmac.digest();
  let val = 0;
  for (let i = 0; i < 6; i++) val = val * 256 + digest[i];
  const limit = Math.floor(Math.pow(2, 48) / range) * range;
  if (val >= limit) return hmacRoll(min, max);
  return min + (val % range);
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
    .setFooter({ text: 'KONVERT FLIPS™', iconURL: logo ?? undefined });
  if (title) embed.setTitle(title);
  if (desc) embed.setDescription(desc);
  if (logo) embed.setThumbnail(logo);
  if (fields?.length) embed.addFields(fields);
  return embed;
}

const wait = ms => new Promise(r => setTimeout(r, ms));

module.exports = { em, wait, hmacRoll, hmacFloat, hmacFloat2, pick, secureShuffle, PURPLE };
