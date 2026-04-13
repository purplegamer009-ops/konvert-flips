const { SlashCommandBuilder } = require('discord.js');
const { em, wait } = require('../utils/theme');
const { log } = require('../utils/logger');

function crashPoint() {
  const r = Math.random();
  if (r < 0.40) return +(Math.random() * 0.9 + 1.0).toFixed(2);
  if (r < 0.65) return +(Math.random() * 2   + 2  ).toFixed(2);
  if (r < 0.82) return +(Math.random() * 5   + 5  ).toFixed(2);
  if (r < 0.93) return +(Math.random() * 10  + 10 ).toFixed(2);
  if (r < 0.98) return +(Math.random() * 30  + 20 ).toFixed(2);
  return +(Math.random() * 50 + 50).toFixed(2);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crash')
    .setDescription('📈  Set a cashout — did it crash first?')
    .addNumberOption(o => o.setName('cashout').setDescription('Target multiplier (e.g. 2.5)').setRequired(true).setMinValue(1.01).setMaxValue(100)),

  async execute(interaction, client) {
    const cashout = interaction.options.getNumber('cashout');
    await interaction.deferReply();

    await interaction.editReply({ embeds: [em('Konvert Flips\' Crash', '📈  Launching...')] });
    await wait(1500);

    const cp = crashPoint();
    const survived = cashout <= cp;

    await interaction.editReply({ embeds: [em(
      'Konvert Flips\' Crash',
      survived
        ? `✅  **${interaction.user.displayName}** cashed out at **${cashout}x**\n💥  Crashed at **${cp}x**`
        : `💥  Crashed at **${cp}x**\n❌  **${interaction.user.displayName}**'s cashout of **${cashout}x** never hit`
    )] });

    await log(client, {
      user: interaction.user,
      game: 'Crash',
      result: survived ? 'WIN' : 'LOSS',
      detail: `Cashout: ${cashout}x  •  Crashed at: ${cp}x`,
    });
  },
};
