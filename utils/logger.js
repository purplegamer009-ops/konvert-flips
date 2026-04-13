const { EmbedBuilder } = require('discord.js');
const { PURPLE } = require('./theme');

/**
 * Log a game result to the log channel.
 * Call this after any game with a result.
 *
 * @param {Client}  client
 * @param {object}  opts
 * @param {User}    opts.user       — the player
 * @param {string}  opts.game       — game name e.g. "Dice Roll"
 * @param {string}  opts.result     — e.g. "WIN" | "LOSS" | "TIE" | "SURVIVED" | "ELIMINATED"
 * @param {string}  opts.detail     — short detail e.g. "Rolled 11 / 12" or "3.45x multiplier"
 * @param {string}  [opts.amount]   — optional wager/amount if set by owner
 */
async function log(client, { user, game, result, detail, amount }) {
  const channelId = process.env.LOG_CHANNEL_ID;
  if (!channelId) return; // silently skip if not configured

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return;

  const isWin  = result === 'WIN' || result === 'SURVIVED' || result === 'BLACKJACK';
  const isLoss = result === 'LOSS' || result === 'BUST' || result === 'ELIMINATED';
  const color  = isWin ? 0x00E676 : isLoss ? 0xFF1744 : PURPLE;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${isWin ? '✅' : isLoss ? '❌' : '🤝'}  ${game}  —  ${result}`)
    .setDescription([
      `👤  **Player:** <@${user.id}>  (${user.username})`,
      `🎮  **Game:** ${game}`,
      `📊  **Result:** ${detail}`,
      amount ? `💰  **Amount:** ${amount}` : null,
    ].filter(Boolean).join('\n'))
    .setTimestamp()
    .setFooter({ text: 'KONVERT FLIPS™  •  Game Log' });

  await channel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { log };
