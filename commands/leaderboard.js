const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { IMAGES, PURPLE } = require('../utils/theme');
const { getAll } = require('./stats');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏆 View the top 10 flip leaderboard'),

  async execute(interaction) {
    const all = getAll();
    if (all.size === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(PURPLE)
          .setDescription('No stats recorded yet.')
          .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })]
      });
    }

    const sorted = [...all.entries()]
      .sort((a, b) => b[1].pnl - a[1].pnl)
      .slice(0, 10);

    const MEDALS = ['🥇', '🥈', '🥉'];
    const lines = sorted.map(([userId, s], i) => {
      const pnlStr = (s.pnl >= 0 ? '+$' : '-$') + Math.abs(s.pnl).toFixed(2);
      const medal  = MEDALS[i] ?? '`' + (i + 1) + '`';
      const bar    = s.pnl >= 0 ? '▲' : '▼';
      return medal + '  <@' + userId + '>\n┕ ' + bar + ' **' + pnlStr + '**  •  ' + s.wins + 'W ' + s.losses + 'L';
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
          { name: '📈 Biggest Winner', value: '<@' + top[0] + '>  **+$' + Math.abs(top[1].pnl).toFixed(2) + '**', inline: true },
          { name: '📉 Biggest Loser',  value: '<@' + bot[0] + '>  **-$' + Math.abs(bot[1].pnl).toFixed(2) + '**', inline: true },
        )
        .setFooter({ text: 'Top 10 by P&L  •  /stats @user for details', iconURL: IMAGES.logo })
        .setTimestamp()
      ]
    });
  },
};
