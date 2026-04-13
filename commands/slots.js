const { SlashCommandBuilder } = require('discord.js');
const { em, wait, rnd } = require('../utils/theme');
const { log } = require('../utils/logger');

const SYM = ['🍒','🍋','🍊','🍇','💎','7️⃣','🎰','⭐','🔔','🍀'];
const W   = [20,  18,  15,  12,  5,   4,   3,   10,  8,   5 ];

function spin() {
  const t = W.reduce((a,b) => a+b, 0);
  const one = () => {
    let r = Math.random() * t;
    for (let i = 0; i < SYM.length; i++) { r -= W[i]; if (r <= 0) return SYM[i]; }
    return SYM[SYM.length-1];
  };
  return [one(), one(), one()];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('🎰  Spin the slot machine'),

  async execute(interaction, client) {
    await interaction.deferReply();

    await interaction.editReply({ embeds: [em('Konvert Flips\' Slots', '🎰  Spinning...')] });
    await wait(1200);

    const reels = spin();
    const [a,b,c] = reels;
    const isJackpot = a===b && b===c;
    const isPair    = a===b || b===c || a===c;
    const result    = isJackpot ? 'JACKPOT' : isPair ? 'WIN' : 'LOSS';

    await interaction.editReply({ embeds: [em(
      'Konvert Flips\' Slots',
      `🎰  **${reels.join('  ')}**${isJackpot ? '\n\n🏆  **JACKPOT**' : isPair ? '\n\n✅  **Match**' : ''}`
    )] });

    await log(client, {
      user: interaction.user,
      game: 'Slots',
      result,
      detail: `${reels.join(' ')}  —  ${isJackpot ? 'Jackpot' : isPair ? 'Two of a kind' : 'No match'}`,
    });
  },
};
