const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { IMAGES, PURPLE } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏆 Top 10 flip leaderboard')
    .addStringOption(o => o
      .setName('action')
      .setDescription('Owner: clear all stats')
      .setRequired(false)
      .addChoices({ name: '🗑️ Clear all stats', value: 'clear' })
    ),

  async execute(interaction) {
    // Import here to avoid any load-order issues
    const { getAll, clearAll } = require('./stats');

    const action = interaction.options.getString('action');

    if (action === 'clear') {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: '🚫 Owner only.', ephemeral: true });
      }
      clearAll();
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xFF1744)
          .setTitle('🗑️  Leaderboard Wiped')
          .setDescription('All stats cleared.')
          .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
          .setTimestamp()
        ], ephemeral: true
      });
    }

    const all = getAll();
    if (all.size === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(PURPLE)
          .setDescription('No stats yet. Log results using the defeats tracker.')
          .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })]
      });
    }

    // Top 10 only, sorted by P&L
    const sorted = [...all.entries()]
      .sort((a, b) => b[1].pnl - a[1].pnl)
      .slice(0, 10);

    const MEDALS = ['🥇', '🥈', '🥉'];
    const lines = sorted.map(([userId, s], i) => {
      const pnlStr = (s.pnl >= 0 ? '+$' : '-$') + Math.abs(s.pnl).toFixed(2);
      const medal  = MEDALS[i] ?? '`' + (i + 1) + '`';
      const arrow  = s.pnl >= 0 ? '▲' : '▼';
      return medal + '  <@' + userId + '>\n┕ ' + arrow + ' **' + pnlStr + '**  •  ' + s.wins + 'W ' + s.losses + 'L';
    });

    const top = sorted[0];
    const bot = sorted[sorted.length - 1];

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(PURPLE)
        .setAuthor({ name: 'KONVAULT™  •  Flip Leaderboard', iconURL: IMAGES.logo })
        .setThumbnail(IMAGES.logo)
        .setDescription(lines.join('\n\n'))
        .addFields(
          { name: '📈 Most Up',   value: '<@' + top[0] + '>  **+$' + Math.abs(top[1].pnl).toFixed(2) + '**', inline: true },
          { name: '📉 Most Down', value: '<@' + bot[0] + '>  **-$' + Math.abs(bot[1].pnl).toFixed(2) + '**', inline: true },
        )
        .setFooter({ text: 'Top 10 by P&L  •  /stats @user for details', iconURL: IMAGES.logo })
        .setTimestamp()
      ]
    });
  },
};
