const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');
module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('📖  All Konvert Flips commands'),
  async execute(interaction) {
    await interaction.reply({ embeds: [em('KONVERT FLIPS™  —  COMMANDS', [
      '**Solo**',
      '🎲  `/dice` — Roll two dice',
      '🚀  `/limbo` — Random multiplier 1x–100x',
      '🪙  `/coinflip` — Heads or Tails',
      '🃏  `/highcard` — Draw a card',
      '🎡  `/roulette` — Spin the wheel',
      '🎟️  `/scratch` — Scratch a card',
      '🎰  `/slots` — Spin the slot machine',
      '',
      '**1v1**',
      '✂️  `/rps @user` — Rock Paper Scissors via DM',
      '🃏  `/blackjack @user` — Hit or Stand via DM',
      '📈  `/crash @user` — Secret cashout popup',
      '🔫  `/russian @user` — Russian Roulette',
      '🔢  `/highlow @user` — Higher or Lower',
      '',
      '**Owner**',
      '📋  `/logresult` — Manually log a result',
    ].join('\n'))] });
  },
};
