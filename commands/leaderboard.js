const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { IMAGES, PURPLE } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏆 Flip leaderboard — biggest winners and losers')
    .addStringOption(o => o.setName('action').setDescription('Owner: clear all stats').setRequired(false)
      .addChoices({ name: '🗑️ Clear all stats', value: 'clear' })),

  async execute(interaction) {
    const { getAll, clearAll } = require('./stats');
    const action = interaction.options.getString('action');

    if (action === 'clear') {
      if (interaction.user.id !== process.env.OWNER_ID)
        return interaction.reply({ content: '🚫 Owner only.', ephemeral: true });
      clearAll();
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xFF1744).setTitle('🗑️ Leaderboard Cleared')
          .setDescription('All stats wiped.').setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })],
        ephemeral: true
      });
    }

    const all = getAll();
    const entries = Object.entries(all);

    // Filter out players with zero activity
    const active = entries.filter(([, s]) => s.wins > 0 || s.losses > 0 || s.pnl !== 0);

    if (active.length === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(PURPLE)
          .setDescription('No stats yet. Log defeats to build the leaderboard.')
          .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })]
      });
    }

    // Sort by P&L
    const sorted = active.sort((a, b) => b[1].pnl - a[1].pnl);

    // Top 5 winners (positive pnl)
    const winners = sorted.filter(([, s]) => s.pnl > 0).slice(0, 5);
    // Top 5 losers (negative pnl, show worst first)
    const losers  = sorted.filter(([, s]) => s.pnl < 0).slice(-5).reverse();

    const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

    const winLines = winners.length > 0
      ? winners.map(([userId, s], i) => {
          const pnlStr = '+$' + Math.abs(s.pnl).toFixed(2);
          return MEDALS[i] + '  <@' + userId + '>\n┕ ▲ **' + pnlStr + '**  •  ' + s.wins + 'W ' + s.losses + 'L';
        }).join('\n\n')
      : '*No winners yet*';

    const loseLines = losers.length > 0
      ? losers.map(([userId, s], i) => {
          const pnlStr = '-$' + Math.abs(s.pnl).toFixed(2);
          return MEDALS[i] + '  <@' + userId + '>\n┕ ▼ **' + pnlStr + '**  •  ' + s.wins + 'W ' + s.losses + 'L';
        }).join('\n\n')
      : '*No losers yet*';

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(PURPLE)
        .setAuthor({ name: 'KONVAULT™  •  Flip Leaderboard', iconURL: IMAGES.logo })
        .setThumbnail(IMAGES.logo)
        .addFields(
          { name: '📈  Biggest Winners', value: winLines, inline: false },
          { name: '📉  Biggest Losers',  value: loseLines, inline: false },
        )
        .setFooter({ text: 'KONVAULT™  •  /stats @user for details', iconURL: IMAGES.logo })
        .setTimestamp()
      ]
    });
  },
};
