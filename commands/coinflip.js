const { SlashCommandBuilder } = require('discord.js');
const { em, wait, hmacRoll } = require('../utils/theme');
const { log } = require('../utils/logger');
module.exports = {
  data: new SlashCommandBuilder().setName('coinflip').setDescription('🪙  Flip a coin'),
  async execute(interaction, client) {
    await interaction.deferReply();
    for (const frame of ['`[░░░░░░░░░░]`','`[████░░░░░░]`','`[████████░░]`','`[██████████]`']) {
      await interaction.editReply({ embeds: [em('Konvert Flips\' Coinflip', '🪙  Flipping...\n' + frame)] }); await wait(300);
    }
    const result = hmacRoll(1, 2) === 1 ? 'HEADS' : 'TAILS';
    await interaction.editReply({ embeds: [em('Konvert Flips\' Coinflip', (result === 'HEADS' ? '🟡' : '⚪') + '  **' + result + '**')] });
    await log(client, { user: interaction.user, game: 'Coinflip', result: 'FLIP', detail: result });
  },
};
