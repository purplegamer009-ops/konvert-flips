const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { IMAGES, PURPLE } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adjuststats')
    .setDescription('🔧 Owner: adjust a player\'s P&L')
    .addUserOption(o => o.setName('user').setDescription('Player to adjust').setRequired(true))
    .addNumberOption(o => o.setName('amount').setDescription('Amount to add or subtract (e.g. 10 or -10)').setRequired(true)),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID)
      return interaction.reply({ content: '🚫 Owner only.', ephemeral: true });

    const { getStats, exportJSON } = require('./stats');
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getNumber('amount');
    const s = getStats(target.id);

    const before = s.pnl;
    s.pnl = parseFloat((s.pnl + amount).toFixed(2));

    // Save via exportJSON trick — stats object is mutated in place
    const fs = require('fs');
    fs.writeFileSync('/tmp/konvault_stats.json', exportJSON(), 'utf8');

    const pnlStr  = n => (n >= 0 ? '+$' : '-$') + Math.abs(n).toFixed(2);
    const adjStr  = (amount >= 0 ? '+$' : '-$') + Math.abs(amount).toFixed(2);

    await interaction.reply({
      ephemeral: true,
      embeds: [new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle('🔧  Stats Adjusted')
        .setThumbnail(IMAGES.logo)
        .setDescription('<@' + target.id + '>')
        .addFields(
          { name: 'Adjustment', value: '**' + adjStr + '**', inline: true },
          { name: 'Before',     value: pnlStr(before),       inline: true },
          { name: 'After',      value: '**' + pnlStr(s.pnl) + '**', inline: true },
        )
        .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
        .setTimestamp()
      ]
    });
  },
};
