const { SlashCommandBuilder } = require('discord.js');
const { em, wait, hmacRoll } = require('../utils/theme');
const FACE = ['⚀','⚁','⚂','⚃','⚄','⚅'];
module.exports = {
  data: new SlashCommandBuilder().setName('dice').setDescription('🎲  Roll two dice')
    .addIntegerOption(o => o.setName('sides').setDescription('Sides per die (default 6)').setMinValue(2).setMaxValue(100)),
  async execute(interaction) {
    const sides = interaction.options.getInteger('sides') ?? 6;
    await interaction.deferReply();
    await interaction.editReply({ embeds: [em('Konvert Flips\' Dice Roll', '🎲  Rolling...')] });
    await wait(1000);
    const d1 = hmacRoll(1, sides), d2 = hmacRoll(1, sides);
    const f1 = sides === 6 ? FACE[d1-1] : d1, f2 = sides === 6 ? FACE[d2-1] : d2;
    await interaction.editReply({ embeds: [em('Konvert Flips\' Dice Roll',
      '**' + interaction.user.displayName + '** rolled **' + f1 + '** & **' + f2 + '**\n\nTotal: **' + (d1+d2) + '**'
    )] });
  },
};
