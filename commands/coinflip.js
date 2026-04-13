const { SlashCommandBuilder } = require('discord.js');
const { em, wait } = require('../utils/theme');
const { log } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('🪙  Flip a coin'),

  async execute(interaction, client) {
    await interaction.deferReply();

    await interaction.editReply({ embeds: [em('Konvert Flips\' Coinflip', '🪙  Flipping...')] });
    await wait(1000);

    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const emoji  = result === 'Heads' ? '🟡' : '⚪';

    await interaction.editReply({ embeds: [em(
      'Konvert Flips\' Coinflip',
      `${emoji}  **${result}**`
    )] });

    await log(client, {
      user: interaction.user,
      game: 'Coinflip',
      result: 'FLIP',
      detail: result,
    });
  },
};
