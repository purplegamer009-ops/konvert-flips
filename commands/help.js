const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📖  All Konvert Flips commands'),

  async execute(interaction) {
    await interaction.reply({ embeds: [em(
      'KONVERT FLIPS™  —  COMMANDS',
      [
        '🎲  `/dice`  —  Roll two dice',
        '🚀  `/limbo`  —  Random multiplier 1x–100x',
        '🪙  `/coinflip`  —  Heads or Tails',
        '🎰  `/slots`  —  Spin the reels',
        '🃏  `/highcard`  —  Draw a card',
        '📈  `/crash`  —  Set a cashout target',
        '✂️  `/rps`  —  Rock Paper Scissors vs bot',
        '🎡  `/roulette`  —  Spin the wheel',
        '🃏  `/blackjack`  —  Hit or Stand vs dealer',
        '🎟️  `/scratch`  —  Scratch a lottery card',
        '🔫  `/russian`  —  Russian Roulette',
        '',
        '📋  `/logresult`  —  Owner: log a result manually',
      ].join('\n')
    )] });
  },
};
