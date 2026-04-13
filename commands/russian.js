const { SlashCommandBuilder } = require('discord.js');
const { em, wait, rnd } = require('../utils/theme');
const { log } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('russian')
    .setDescription('🔫  Russian Roulette — 1 in 6'),

  async execute(interaction, client) {
    await interaction.deferReply();

    await interaction.editReply({ embeds: [em('Konvert Flips\' Russian Roulette', '🔫  Loading...')] });
    await wait(800);
    await interaction.editReply({ embeds: [em('Konvert Flips\' Russian Roulette', '🔫  Spinning the cylinder... 🌀')] });
    await wait(800);
    await interaction.editReply({ embeds: [em('Konvert Flips\' Russian Roulette', '🔫  ...')] });
    await wait(1000);

    const chamber  = rnd(1,6);
    const survived = chamber !== 1;

    await interaction.editReply({ embeds: [em(
      'Konvert Flips\' Russian Roulette',
      survived
        ? `🔔  **CLICK** — Empty chamber\n\n✅  **${interaction.user.displayName}** survived`
        : `💥  **BANG**\n\n💀  **${interaction.user.displayName}** didn't make it`
    )] });

    await log(client, {
      user: interaction.user,
      game: 'Russian Roulette',
      result: survived ? 'SURVIVED' : 'ELIMINATED',
      detail: `Chamber #${chamber} of 6`,
    });
  },
};
