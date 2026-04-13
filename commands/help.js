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
        '**Solo Games**',
        '🎲  `/dice`  —  Roll two dice',
        '🚀  `/limbo`  —  Random multiplier 1x–100x',
        '🪙  `/coinflip`  —  Heads or Tails',
        '🃏  `/highcard`  —  Draw a card',
        '🎡  `/roulette`  —  Spin the wheel',
        '🎟️  `/scratch`  —  Scratch a lottery card',
        '🔫  `/russian`  —  Russian Roulette',
        '',
        '**1v1 Games**',
        '📈  `/crash @user 2.5`  —  Both set cashouts, same crash point',
        '✂️  `/rps @user`  —  Rock Paper Scissors, both pick live',
        '🃏  `/blackjack @user`  —  Take turns, compare hands',
        '',
        '📋  `/logresult`  —  Owner only: log a result manually',
      ].join('\n')
    )] });
  },
};
