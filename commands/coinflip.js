const { SlashCommandBuilder } = require('discord.js');
const { em, wait, hmacRoll } = require('../utils/theme');
module.exports = {
  data: new SlashCommandBuilder().setName('coinflip').setDescription('🪙  Flip a coin'),
  async execute(interaction) {
    await interaction.deferReply();
    await interaction.editReply({ embeds: [em('Konvert Flips\' Coinflip', '🪙  Flipping...')] });
    await wait(1000);
    const result = hmacRoll(1, 2) === 1 ? 'HEADS' : 'TAILS';
    await interaction.editReply({ embeds: [em('Konvert Flips\' Coinflip', (result === 'HEADS' ? '🟡' : '⚪') + '  **' + result + '**')] });
  },
};
