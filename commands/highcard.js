const { SlashCommandBuilder } = require('discord.js');
const { em, wait, rnd } = require('../utils/theme');
const { log } = require('../utils/logger');

const SUITS = ['♠️','♥️','♦️','♣️'];
const VALS  = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('highcard')
    .setDescription('🃏  Draw a card'),

  async execute(interaction, client) {
    await interaction.deferReply();

    await interaction.editReply({ embeds: [em('Konvert Flips\' High Card', '🃏  Drawing...')] });
    await wait(900);

    const v = rnd(0,12), s = SUITS[rnd(0,3)];
    const card = `${VALS[v]}${s}`;

    await interaction.editReply({ embeds: [em(
      'Konvert Flips\' High Card',
      `🃏  **${interaction.user.displayName}** drew **${card}**`
    )] });

    await log(client, {
      user: interaction.user,
      game: 'High Card',
      result: 'DRAW',
      detail: card,
    });
  },
};
