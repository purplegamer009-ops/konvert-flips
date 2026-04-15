const { SlashCommandBuilder } = require('discord.js');
const { em, wait, hmacFloat, hmacFloat2 } = require('../utils/theme');
const { log } = require('../utils/logger');
function roll() {
  const r = hmacFloat();
  if (r < 0.01) return hmacFloat2(50, 100);
  if (r < 0.05) return hmacFloat2(20, 50);
  if (r < 0.15) return hmacFloat2(10, 20);
  if (r < 0.35) return hmacFloat2(5, 10);
  if (r < 0.65) return hmacFloat2(2, 5);
  return hmacFloat2(1, 2);
}
module.exports = {
  data: new SlashCommandBuilder().setName('limbo').setDescription('🚀  Launch into Limbo'),
  async execute(interaction, client) {
    await interaction.deferReply();
    await interaction.editReply({ embeds: [em('Konvert Flips\' Limbo', '🚀  Launching...')] });
    await wait(1000);
    const m = roll();
    await interaction.editReply({ embeds: [em('Konvert Flips\' Limbo', '**' + interaction.user.displayName + '** landed on **' + m + 'x**')] });
    await log(client, { user: interaction.user, game: 'Limbo', result: m >= 2 ? 'WIN' : 'LOSS', detail: m + 'x' });
  },
};
