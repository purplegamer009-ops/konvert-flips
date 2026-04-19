const { EmbedBuilder } = require('discord.js');
const { PURPLE } = require('./theme');

async function log(client, { user, game, result, detail, amount }) {
  const channelId = process.env.LOG_CHANNEL_ID;
  if (!channelId) return;
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
    .setFooter({ text: 'KONVAULT™  •  Game Log' });
  await channel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { log };
