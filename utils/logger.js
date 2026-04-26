const { EmbedBuilder } = require('discord.js');
const { PURPLE } = require('./theme');

async function log(client, { user, game, result, detail }) {
  try {
    const channelId = process.env.LOG_CHANNEL_ID;
    if (!channelId) { console.log('LOG_CHANNEL_ID not set'); return; }
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) { console.log('Log channel not found'); return; }
    const isWin  = result === 'WIN';
    const isLoss = result === 'LOSS';
    const color  = isWin ? 0x00E676 : isLoss ? 0xFF1744 : PURPLE;
    const LOGO   = 'https://i.imgur.com/RKP25MI.png';
    const embed  = new EmbedBuilder()
      .setColor(color)
      .setTitle((isWin ? '✅' : isLoss ? '❌' : '🤝') + '  ' + game + ' — ' + result)
      .setDescription('👤 <@' + user.id + '>  (' + user.username + ')\n📊 ' + detail)
      .setTimestamp()
      .setFooter({ text: 'KONVAULT™  •  Game Log', iconURL: LOGO });
    await channel.send({ embeds: [embed] });
  } catch(e) {
    console.error('Logger error:', e);
  }
}

module.exports = { log };
