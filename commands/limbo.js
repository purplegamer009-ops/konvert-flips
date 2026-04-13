const { SlashCommandBuilder } = require('discord.js');
const { em, wait } = require('../utils/theme');
const { log } = require('../utils/logger');

function roll() {
  const r = Math.random();
  if (r < 0.01) return +(Math.random() * 50 + 50).toFixed(2);
  if (r < 0.05) return +(Math.random() * 30 + 20).toFixed(2);
  if (r < 0.15) return +(Math.random() * 10 + 10).toFixed(2);
  if (r < 0.35) return +(Math.random() * 5  + 5 ).toFixed(2);
  if (r < 0.65) return +(Math.random() * 3  + 2 ).toFixed(2);
  return +(Math.random() + 1).toFixed(2);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('limbo')
    .setDescription('🚀  Launch into Limbo'),

  async execute(interaction, client) {
    await interaction.deferReply();

    await interaction.editReply({ embeds: [em('Konvert Flips\' Limbo', '🚀  Launching...')] });
    await wait(1200);

    const m = roll();

    await interaction.editReply({ embeds: [em(
      'Konvert Flips\' Limbo',
      `🚀  **${interaction.user.displayName}** landed on **${m}x**`
    )] });

    await log(client, {
      user: interaction.user,
      game: 'Limbo',
      result: m >= 2 ? 'WIN' : 'LOSS',
      detail: `${m}x multiplier`,
    });
  },
};
