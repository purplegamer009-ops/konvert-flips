const { EmbedBuilder } = require('discord.js');

const PURPLE = 0x7C4DFF;
const logo   = () => process.env.LOGO_URL || null;

function em(title, desc, fields) {
  const e = new EmbedBuilder()
    .setColor(PURPLE)
    .setFooter({ text: 'KONVERT FLIPS™', iconURL: logo() ?? undefined });

  if (title)        e.setTitle(title);
  if (desc)         e.setDescription(desc);
  if (logo())       e.setThumbnail(logo());
  if (fields?.length) e.addFields(fields);
  return e;
}

const wait = ms => new Promise(r => setTimeout(r, ms));
const rnd  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

module.exports = { em, wait, rnd, pick, PURPLE };
