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
    .setDescription('📊 Check your or another player\'s stats')
    .addUserOption(o => o
      .setName('user')
      .setDescription('Player to check — leave empty for your own stats')
      .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const s = getStats(target.id);

    if (s.wins === 0 && s.losses === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(PURPLE)
          .setDescription('No recorded activity for <@' + target.id + '> yet.')
          .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
        ]
      });
    }

    const total   = s.wins + s.losses;
    const winRate = total > 0 ? ((s.wins / total) * 100).toFixed(1) : '0';
    const up      = s.pnl >= 0;
    const pnlStr  = (up ? '+$' : '-$') + Math.abs(s.pnl).toFixed(2);

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(up ? 0x00E676 : 0xFF1744)
        .setAuthor({ name: target.displayName + '  •  Player Stats', iconURL: target.displayAvatarURL() })
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: '💰 P&L',      value: '```' + pnlStr + '```',                         inline: true },
          { name: '📊 Record',   value: '```' + s.wins + 'W  /  ' + s.losses + 'L```',  inline: true },
          { name: '🎯 Win Rate', value: '```' + winRate + '%```',                        inline: true },
          { name: '🎮 Games',    value: '```' + total + '```',                           inline: true },
          { name: '📈 Status',   value: '```' + (up ? 'Profitable' : 'In the red') + '```', inline: true },
        )
        .setFooter({ text: 'KONVAULT™  •  Flip Stats', iconURL: IMAGES.logo })
        .setTimestamp()
      ]
    });
  },
};
