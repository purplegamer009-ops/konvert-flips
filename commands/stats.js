const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { IMAGES, PURPLE } = require('../utils/theme');
const fs = require('fs');
const path = require('path');

const FILE = '/tmp/konvault_stats.json';
let data = {};

// Load immediately when module is first required
function loadFromDisk() {
  try {
    if (fs.existsSync(FILE)) {
      data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      console.log('[Stats] Loaded ' + Object.keys(data).length + ' players from disk');
    }
  } catch(e) { console.error('[Stats] Load error:', e.message); }
}

function saveToDisk() {
  try { fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8'); }
  catch(e) { console.error('[Stats] Save error:', e.message); }
}

loadFromDisk();

function getStats(userId) {
  if (!data[userId]) data[userId] = { wins: 0, losses: 0, pnl: 0 };
  return data[userId];
}

function recordResult(winnerId, loserId, amount) {
  const w = getStats(winnerId);
  const l = getStats(loserId);
  w.wins++;
  w.pnl = parseFloat((w.pnl + amount).toFixed(2));
  l.losses++;
  l.pnl = parseFloat((l.pnl - amount).toFixed(2));
  saveToDisk();
  console.log('[Stats] Recorded: winner=' + winnerId + ' loser=' + loserId + ' amount=$' + amount);
}

function clearAll() {
  data = {};
  saveToDisk();
}

function getAll() { return data; }
function exportJSON() { return JSON.stringify(data, null, 2); }
function importJSON(str) { data = JSON.parse(str); saveToDisk(); }

module.exports = {
  getStats, recordResult, clearAll, getAll, exportJSON, importJSON,

  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('📊 Check your stats')
    .addUserOption(o => o.setName('user').setDescription('Player to check (empty = you)').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const s = getStats(target.id);

    if (s.wins === 0 && s.losses === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(PURPLE)
          .setDescription('No recorded activity for <@' + target.id + '> yet.')
          .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })]
      });
    }

    const total   = s.wins + s.losses;
    const winRate = total > 0 ? ((s.wins / total) * 100).toFixed(1) : '0';
    const up      = s.pnl >= 0;
    const pnlStr  = (up ? '+$' : '-$') + Math.abs(s.pnl).toFixed(2);

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(up ? 0x00E676 : 0xFF1744)
        .setAuthor({ name: target.displayName + '  •  Flip Stats', iconURL: target.displayAvatarURL() })
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: '💰 P&L',      value: '```' + pnlStr + '```',                        inline: true },
          { name: '📊 Record',   value: '```' + s.wins + 'W / ' + s.losses + 'L```',   inline: true },
          { name: '🎯 Win Rate', value: '```' + winRate + '%```',                       inline: true },
          { name: '🎮 Games',    value: '```' + total + '```',                          inline: true },
          { name: '📈 Status',   value: '```' + (up ? 'Profitable ▲' : 'In the red ▼') + '```', inline: true },
        )
        .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
        .setTimestamp()
      ]
    });
  },
};
