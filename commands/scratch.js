const { SlashCommandBuilder } = require('discord.js');
const { em, wait } = require('../utils/theme');
const { log } = require('../utils/logger');

const PRIZES = [
  { s:'💎', t:5, c:1  },
  { s:'🏆', t:4, c:3  },
  { s:'💰', t:3, c:8  },
  { s:'⭐', t:2, c:15 },
  { s:'🎯', t:1, c:25 },
  { s:'❌', t:0, c:48 },
];

function rollPrize() {
  const tot = PRIZES.reduce((a,b) => a+b.c, 0);
  let r = Math.random() * tot;
  for (const p of PRIZES) { r -= p.c; if (r <= 0) return p; }
  return PRIZES[PRIZES.length-1];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scratch')
    .setDescription('🎟️  Scratch a lottery card — instant reveal!'),

  async execute(interaction, client) {
    await interaction.deferReply();

    await interaction.editReply({ embeds: [em('Konvert Flips\' Scratch Card', '🂠  🂠  🂠\n\nScratching...')] });
    await wait(1200);

    const [p1, p2, p3] = [rollPrize(), rollPrize(), rollPrize()];
    const match  = p1.s === p2.s && p2.s === p3.s;
    const result = match && p1.t > 0 ? 'WIN' : 'LOSS';

    let line;
    if (match && p1.t === 5)      line = `💎  **TRIPLE DIAMOND — Jackpot!**`;
    else if (match && p1.t === 4) line = `🏆  **Triple Trophy — Big win!**`;
    else if (match && p1.t === 3) line = `💰  **Triple Money Bag!**`;
    else if (match && p1.t === 2) line = `⭐  **Triple Star!**`;
    else if (match && p1.t === 1) line = `🎯  **Triple Bullseye!**`;
    else if (match && p1.t === 0) line = `❌  Triple nothing — unlucky`;
    else                          line = `❌  No match`;

    await interaction.editReply({ embeds: [em(
      'Konvert Flips\' Scratch Card',
      `${p1.s}  ${p2.s}  ${p3.s}\n\n${line}`
    )] });

    await log(client, {
      user: interaction.user,
      game: 'Scratch Card',
      result,
      detail: `${p1.s} ${p2.s} ${p3.s}  —  ${match && p1.t > 0 ? 'Match!' : 'No match'}`,
    });
  },
};
