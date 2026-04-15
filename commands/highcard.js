const { SlashCommandBuilder } = require('discord.js');
const { em, wait, hmacRoll } = require('../utils/theme');
const { log } = require('../utils/logger');
const SUITS = ['♠️','♥️','♦️','♣️'];
const VALS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
module.exports = {
  data: new SlashCommandBuilder().setName('highcard').setDescription('🃏  Draw a random card'),
  async execute(interaction, client) {
    await interaction.deferReply();
    await interaction.editReply({ embeds: [em('Konvert Flips\' High Card', '🃏  Drawing...')] });
    await wait(1000);
    const card = VALS[hmacRoll(0, 12)] + SUITS[hmacRoll(0, 3)];
    await interaction.editReply({ embeds: [em('Konvert Flips\' High Card', '**' + interaction.user.displayName + '** drew **' + card + '**')] });
    await log(client, { user: interaction.user, game: 'High Card', result: 'DRAW', detail: card });
  },
};
