const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { IMAGES, PURPLE } = require('../utils/theme');
const fs = require('fs');
const path = require('path');

const STATS_FILE = path.join('/tmp', 'konvault_stats.json');

function load() {
  try {
    if (fs.existsSync(STATS_FILE)) return new Map(Object.entries(JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'))));
  } catch(e) {}
  return new Map();
}

function save(stats) {
  try {
    const obj = {};
    for (const [k, v] of stats) obj[k] = v;
    fs.writeFileSync(STATS_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch(e) {}
}

const stats = load();

function getStats(userId) {
  if (!stats.has(userId)) stats.set(userId, { wins: 0, losses: 0, pnl: 0 });
  return stats.get(userId);
}

function recordResult(winnerId, loserId, amount) {
  const w = getStats(winnerId);
  const l = getStats(loserId);
  w.wins++;
  w.pnl = parseFloat((w.pnl + amount).toFixed(2));
  l.losses++;
  l.pnl = parseFloat((l.pnl - amount).toFixed(2));
  stats.set(winnerId, w);
  stats.set(loserId, l);
  save(stats);
}

function clearAll() {
  stats.clear();
  save(stats);
}

function getAll() { return stats; }

function exportJSON() {
  const obj = {};
  for (const [k, v] of stats) obj[k] = v;
  return JSON.stringify(obj, null, 2);
}

function importJSON(jsonStr) {
  const obj = JSON.parse(jsonStr);
  for (const [k, v] of Object.entries(obj)) stats.set(k, v);
  save(stats);
}

module.exports = {
  getStats, recordResult, clearAll, getAll, exportJSON, importJSON,

  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('📊 Check wins, losses and P&L')
    .addSubcommand(s => s.setName('check').setDescription('Check a player or leaderboard')
      .addUserOption(o => o.setName('user').setDescription('User to check — empty for leaderboard').setRequired(false)))
    .addSubcommand(s => s.setName('clear').setDescription('🗑️ Owner: wipe the entire leaderboard')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'clear') {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: '🚫 Owner only.', ephemeral: true });
      }
      clearAll();
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xFF1744)
          .setTitle('🗑️  Leaderboard Cleared')
          .setDescription('All stats have been wiped.')
          .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
          .setTimestamp()
        ], ephemeral: true
      });
    }

    const target = interaction.options.getUser('user');

    if (target) {
      const s = getStats(target.id);
      if (s.wins === 0 && s.losses === 0) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(PURPLE)
            .setDescription('📊 No recorded activity for <@' + target.id + '> yet.')
            .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })]
        });
      }
      const total   = s.wins + s.losses;
      const winRate = total > 0 ? ((s.wins / total) * 100).toFixed(1) : '0';
      const pnlPos  = s.pnl >= 0;
      const pnlStr  = (pnlPos ? '+$' : '-$') + Math.abs(s.pnl).toFixed(2);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(pnlPos ? 0x00E676 : 0xFF1744)
          .setTitle('📊  ' + target.displayName)
          .setThumbnail(target.displayAvatarURL())
          .addFields(
            { name: 'P&L',      value: '**' + pnlStr + '**',                     inline: true },
            { name: 'Record',   value: '**' + s.wins + 'W  ' + s.losses + 'L**', inline: true },
            { name: 'Win Rate', value: '**' + winRate + '%**',                    inline: true },
            { name: 'Games',    value: '**' + total + '**',                       inline: true },
          )
          .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo }).setTimestamp()
        ]
      });
    }

    const all = getAll();
    if (all.size === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(PURPLE)
          .setDescription('📊 No stats recorded yet.')
          .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })]
      });
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
    const top = sorted[0], bot = sorted[sorted.length - 1];
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle('📊  Konvault Leaderboard')
        .setThumbnail(IMAGES.logo)
        .setDescription(lines.join('\n'))
        .addFields(
          { name: '📈 Most Up',   value: '<@' + top[0] + '>  **+$' + Math.abs(top[1].pnl).toFixed(2) + '**', inline: true },
          { name: '📉 Most Down', value: '<@' + bot[0] + '>  **-$' + Math.abs(bot[1].pnl).toFixed(2) + '**', inline: true },
        )
        .setFooter({ text: 'KONVAULT™  •  /stats check @user for details', iconURL: IMAGES.logo })
        .setTimestamp()
      ]
    });
  },
};
