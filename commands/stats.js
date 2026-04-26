const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { IMAGES, PURPLE } = require('../utils/theme');
const { getStats, getAll } = require('../utils/stats');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('📊 Check player stats or leaderboard')
    .addUserOption(o => o.setName('user').setDescription('User to check (leave empty for leaderboard)').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');

    if (target) {
      const s = getStats(target.id);
      if (s.wins === 0 && s.losses === 0) {
        return interaction.reply({ content: '📊 No recorded activity for <@' + target.id + '> yet.', ephemeral: false });
      }
      const total    = s.wins + s.losses;
      const winRate  = total > 0 ? ((s.wins / total) * 100).toFixed(1) : '0';
      const pnlPos   = s.pnl >= 0;
      const pnlStr   = (pnlPos ? '+$' : '-$') + Math.abs(s.pnl).toFixed(2);

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(pnlPos ? 0x00E676 : 0xFF1744)
          .setTitle('📊  ' + target.displayName)
          .setThumbnail(target.displayAvatarURL())
          .addFields(
            { name: 'P&L',      value: '**' + pnlStr + '**',          inline: true },
            { name: 'Record',   value: '**' + s.wins + 'W  ' + s.losses + 'L**', inline: true },
            { name: 'Win Rate', value: '**' + winRate + '%**',         inline: true },
            { name: 'Games',    value: '**' + total + '**',            inline: true },
          )
          .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
          .setTimestamp()
        ]
      });
    }

    // Leaderboard
    const all = getAll();
    if (all.size === 0) {
      return interaction.reply({ content: '📊 No stats recorded yet.', ephemeral: false });
    }

    const sorted = [...all.entries()].sort((a, b) => b[1].pnl - a[1].pnl);

    const lines = [];
    for (let i = 0; i < Math.min(sorted.length, 15); i++) {
      const [userId, s] = sorted[i];
      const pnlStr = (s.pnl >= 0 ? '+$' : '-$') + Math.abs(s.pnl).toFixed(2);
      const medal  = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '`' + (i + 1) + '`';
      const arrow  = s.pnl >= 0 ? '📈' : '📉';
      lines.push(medal + '  <@' + userId + '>  ' + arrow + ' **' + pnlStr + '**  •  ' + s.wins + 'W ' + s.losses + 'L');
    }

    const top = sorted[0];
    const bot = sorted[sorted.length - 1];

    const biggestWinner = '+$' + Math.abs(top[1].pnl).toFixed(2);
    const biggestLoser  = '-$' + Math.abs(bot[1].pnl).toFixed(2);

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle('📊  Konvault Leaderboard')
        .setThumbnail(IMAGES.logo)
        .setDescription(lines.join('\n'))
        .addFields(
          { name: '📈 Most Up',   value: '<@' + top[0] + '>  **' + biggestWinner + '**', inline: true },
          { name: '📉 Most Down', value: '<@' + bot[0] + '>  **' + biggestLoser + '**',  inline: true },
        )
        .setFooter({ text: 'KONVAULT™  •  Based on logged results', iconURL: IMAGES.logo })
        .setTimestamp()
      ]
    });
  },
};
