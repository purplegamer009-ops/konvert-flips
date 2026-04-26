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

function getAll() { return stats; }

module.exports = { getStats, recordResult, getAll };
