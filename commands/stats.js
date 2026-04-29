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
    .setDescription('📊 Leaderboard and player stats')
    .addSubcommand(s => s
      .setName('check')
      .setDescription('View leaderboard or a specific player')
      .addUserOption(o => o.setName('user').setDescription('Player to check — leave empty for leaderboard').setRequired(false))
    )
    .addSubcommand(s => s
      .setName('clear')
      .setDescription('🗑️ Owner only — wipe all stats')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── CLEAR ──────────────────────────────────────────────
    if (sub === 'clear') {
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: '🚫 Owner only.', ephemeral: true });
      }
      clearAll();
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xFF1744)
          .setTitle('🗑️  Leaderboard Wiped')
          .setDescription('All stats have been cleared.')
          .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
          .setTimestamp()
        ],
        ephemeral: true,
      });
    }

    // ── SINGLE USER ────────────────────────────────────────
    const target = interaction.options.getUser('user');

    if (target) {
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
      const streak  = up ? '📈 Profitable' : '📉 In the red';

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(up ? 0x00E676 : 0xFF1744)
          .setAuthor({ name: target.displayName + '  •  Player Stats', iconURL: target.displayAvatarURL() })
          .setThumbnail(target.displayAvatarURL())
          .addFields(
            { name: '💰 P&L',     value: '```' + pnlStr + '```',                          inline: true  },
            { name: '📊 Record',  value: '```' + s.wins + 'W  /  ' + s.losses + 'L```',   inline: true  },
            { name: '🎯 Win Rate',value: '```' + winRate + '%```',                         inline: true  },
            { name: '🎮 Games',   value: '```' + total + '```',                            inline: true  },
            { name: '📈 Status',  value: '```' + streak + '```',                           inline: true  },
          )
          .setFooter({ text: 'KONVAULT™  •  Flip Stats', iconURL: IMAGES.logo })
          .setTimestamp()
        ]
      });
    }

    // ── LEADERBOARD ────────────────────────────────────────
    const all = getAll();
    if (all.size === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(PURPLE)
          .setDescription('No stats recorded yet.')
          .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
        ]
      });
    }

    // Top 10 by P&L only
    const sorted = [...all.entries()]
      .sort((a, b) => b[1].pnl - a[1].pnl)
      .slice(0, 10);

    const MEDALS = ['🥇', '🥈', '🥉'];
    const lines = sorted.map(([userId, s], i) => {
      const pnlStr = (s.pnl >= 0 ? '+$' : '-$') + Math.abs(s.pnl).toFixed(2);
      const medal  = MEDALS[i] ?? '`' + (i + 1) + '`';
      const bar    = s.pnl >= 0 ? '▲' : '▼';
      return medal + '  <@' + userId + '>\n' +
             '┕ ' + bar + ' **' + pnlStr + '**  •  ' + s.wins + 'W ' + s.losses + 'L';
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
        .setFooter({ text: 'Top 10 by P&L  •  /stats check @user for details', iconURL: IMAGES.logo })
        .setTimestamp()
      ]
    });
  },
};
