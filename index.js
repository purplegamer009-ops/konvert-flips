require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { deployCommands } = require('./deploy-commands');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageTyping,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.commands = new Collection();
client.blockedChannels = new Set();

const LTC_FILE = path.join('/tmp', 'ltc_address.txt');
const SOL_FILE = path.join('/tmp', 'sol_address.txt');
const BACKUP_CHANNEL = '1497880037599219875';

if (fs.existsSync(LTC_FILE)) process.env.LTC_ADDRESS = fs.readFileSync(LTC_FILE, 'utf8').trim();
if (fs.existsSync(SOL_FILE)) process.env.SOL_ADDRESS = fs.readFileSync(SOL_FILE, 'utf8').trim();
if (process.env.LTC_ADDRESS && !fs.existsSync(LTC_FILE)) fs.writeFileSync(LTC_FILE, process.env.LTC_ADDRESS, 'utf8');
if (process.env.SOL_ADDRESS && !fs.existsSync(SOL_FILE)) fs.writeFileSync(SOL_FILE, process.env.SOL_ADDRESS, 'utf8');

for (const file of fs.readdirSync('./commands').filter(f => f.endsWith('.js'))) {
  try {
    const cmd = require('./commands/' + file);
    if (cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
  } catch(e) { console.error('Failed to load ' + file + ':', e.message); }
}

const statsModule = require('./commands/stats');
const { getStats, recordResult, exportJSON, importJSON } = statsModule;
const { generateFairRoll, IMAGES, PURPLE } = require('./utils/theme');
const { storeProof, verifyRow, registerVerifyHandler } = require('./utils/verifyButton');

async function saveStatsBackup() {
  try {
    const channel = await client.channels.fetch(BACKUP_CHANNEL).catch(() => null);
    if (!channel) return;
    const json = exportJSON();
    const buf = Buffer.from(json, 'utf8');
    const attachment = new AttachmentBuilder(buf, { name: 'konvault_stats.json' });
    // Delete previous bot backups only
    const messages = await channel.messages.fetch({ limit: 20 });
    for (const [, m] of messages.filter(m => m.author.id === client.user.id)) {
      await m.delete().catch(() => {});
    }
    await channel.send({ content: '📊 Stats backup — ' + new Date().toUTCString(), files: [attachment] });
    console.log('[Stats] Backup saved');
  } catch(e) { console.error('[Stats] Backup error:', e.message); }
}

async function loadStatsBackup() {
  try {
    const channel = await client.channels.fetch(BACKUP_CHANNEL).catch(() => null);
    if (!channel) { console.log('[Stats] Backup channel not found'); return; }
    const messages = await channel.messages.fetch({ limit: 50 });
    // Find most recent message from ANYONE with a konvault_stats.json attachment
    const backupMsg = messages.find(m =>
      m.attachments.size > 0 &&
      m.attachments.first().name === 'konvault_stats.json'
    );
    if (!backupMsg) { console.log('[Stats] No backup found in channel'); return; }
    const url = backupMsg.attachments.first().url;
    const res = await fetch(url);
    const json = await res.text();
    importJSON(json);
    console.log('[Stats] Loaded from backup — ' + Object.keys(JSON.parse(json)).length + ' players');
  } catch(e) { console.error('[Stats] Restore error:', e.message); }
}

client.once('ready', async function() {
  console.log('🎰 Konvault™ online as ' + client.user.tag);
  client.user.setPresence({ status: 'online', activities: [{ name: '/dice /rps /tower /stats /leaderboard', type: 0 }] });
  await loadStatsBackup();
});

registerVerifyHandler(client);

client.on('interactionCreate', async function(i) {
  if (!i.isChatInputCommand()) return;
  if (client.blockedChannels.has(i.channelId) && !['lock','unlock','gamechannel','endgame'].includes(i.commandName)) {
    return i.reply({ content: '🔒 Games disabled here.', ephemeral: true });
  }
  const cmd = client.commands.get(i.commandName);
  if (!cmd) return;
  try { await cmd.execute(i, client); }
  catch(err) {
    console.error('[Error]', i.commandName, err.message);
    try {
      const r = { content: '❌ Something went wrong.', ephemeral: true };
      if (i.replied || i.deferred) await i.followUp(r); else await i.reply(r);
    } catch {}
  }
});

const DEFEATS_CHANNELS = ['1491899432185364561', '1491899403982602481'];
const COIN_IDS = {
  btc:'bitcoin',eth:'ethereum',sol:'solana',ltc:'litecoin',xrp:'ripple',bnb:'binancecoin',
  usdt:'tether',usdc:'usd-coin',ada:'cardano',doge:'dogecoin',dot:'polkadot',matic:'matic-network',
  avax:'avalanche-2',link:'chainlink',uni:'uniswap',shib:'shiba-inu',trx:'tron',xlm:'stellar',atom:'cosmos',near:'near',
};

client.on('messageCreate', async function(msg) {
  if (msg.author.bot) return;
  if (client.blockedChannels.has(msg.channelId)) return;
  const content = msg.content.trim();
  const lower = content.toLowerCase();

  // Defeats tracker — owner only, specific channels
  if (msg.author.id === process.env.OWNER_ID && DEFEATS_CHANNELS.includes(msg.channelId)) {
    const m = content.match(/<@!?(\d+)>\s+defeats\s+<@!?(\d+)>\s+(\d+(?:\.\d+)?)v(\d+(?:\.\d+)?)/i);
    if (m) {
      const winnerId = m[1];
      const loserId  = m[2];
      const amount   = parseFloat(m[4]);
      recordResult(winnerId, loserId, amount);
      const w = getStats(winnerId);
      const l = getStats(loserId);
      const pnl = n => (n >= 0 ? '+$' : '-$') + Math.abs(n).toFixed(2);
      try {
        const owner = await client.users.fetch(msg.author.id);
        await owner.send({
          embeds: [new EmbedBuilder()
            .setColor(0x00E676)
            .setTitle('🏆  Result Logged')
            .setThumbnail(IMAGES.logo)
            .setDescription('<@' + winnerId + '> defeated <@' + loserId + '>')
            .addFields(
              { name: '🏆 Winner', value: '<@' + winnerId + '>\n**+$' + amount.toFixed(2) + '**\n' + w.wins + 'W ' + w.losses + 'L  •  ' + pnl(w.pnl), inline: true },
              { name: '💀 Loser',  value: '<@' + loserId + '>\n**-$' + amount.toFixed(2) + '**\n' + l.wins + 'W ' + l.losses + 'L  •  ' + pnl(l.pnl), inline: true },
            )
            .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
            .setTimestamp()
          ]
        });
      } catch(e) { console.error('[Defeats] DM error:', e.message); }
      await saveStatsBackup();
      return;
    }
  }

  if (lower === '?dice' || lower === '?roll') {
    const r1 = generateFairRoll(1,6), r2 = generateFairRoll(1,6);
    const proofId = storeProof(msg.channelId, { id: Date.now()+'_dt', game:'Dice', result:r1.result+' & '+r2.result, userId:msg.author.id, serverSeed:r1.serverSeed, clientSeed:r1.clientSeed, nonce:r1.nonce });
    await msg.channel.send({
      embeds:[new EmbedBuilder().setColor(PURPLE).setTitle('🎲  Dice Roll').setThumbnail(IMAGES.dice)
        .setDescription('**'+msg.author.displayName+'** rolled **'+r1.result+'** & **'+r2.result+'** — total **'+(r1.result+r2.result)+'**')
        .setFooter({text:'KONVAULT™',iconURL:IMAGES.logo}).setTimestamp()],
      components:[verifyRow(proofId)],
    });
    return;
  }

  if (lower === '?cf') {
    const roll = generateFairRoll(1,2);
    const result = roll.result===1?'HEADS':'TAILS';
    const proofId = storeProof(msg.channelId, { id:Date.now()+'_cft', game:'Coinflip', result, userId:msg.author.id, serverSeed:roll.serverSeed, clientSeed:roll.clientSeed, nonce:roll.nonce });
    await msg.channel.send({
      embeds:[new EmbedBuilder().setColor(PURPLE).setTitle('🪙  Coin Flip').setThumbnail(IMAGES.coinflip)
        .setDescription((result==='HEADS'?'🟡':'⚪')+'  **'+result+'**')
        .setFooter({text:'KONVAULT™',iconURL:IMAGES.logo}).setTimestamp()],
      components:[verifyRow(proofId)],
    });
    return;
  }

  if (content.startsWith('$') && content.length > 1 && !content.includes(' ')) {
    const ticker = content.slice(1).toLowerCase();
    const coinId = COIN_IDS[ticker];
    if (!coinId) return;
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/coins/'+coinId+'?localization=false&tickers=false&community_data=false&developer_data=false');
      const data = await res.json();
      const price=data.market_data.current_price.usd, change24=data.market_data.price_change_percentage_24h;
      const high24=data.market_data.high_24h.usd, low24=data.market_data.low_24h.usd;
      const marketCap=data.market_data.market_cap.usd;
      const fmt=n=>n>=1e9?'$'+(n/1e9).toFixed(2)+'B':n>=1e6?'$'+(n/1e6).toFixed(2)+'M':'$'+n.toLocaleString();
      const pct=n=>(n>=0?'▲ +':'▼ ')+n.toFixed(2)+'%';
      await msg.channel.send({embeds:[new EmbedBuilder()
        .setColor(change24>=0?0x00E676:0xFF1744)
        .setTitle(data.name+' ('+ticker.toUpperCase()+')')
        .setThumbnail(data.image?.small||IMAGES.logo)
        .setDescription('# $'+price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:8}))
        .addFields(
          {name:'24h Change',value:'`'+pct(change24)+'`',inline:true},
          {name:'24h High',value:'`$'+high24.toLocaleString()+'`',inline:true},
          {name:'24h Low',value:'`$'+low24.toLocaleString()+'`',inline:true},
          {name:'Market Cap',value:'`'+fmt(marketCap)+'`',inline:true},
        )
        .setFooter({text:'KONVAULT™  •  Live',iconURL:IMAGES.logo}).setTimestamp()]});
    } catch(e) { console.error(e); }
    return;
  }
});

(async function() { await deployCommands(); client.login(process.env.DISCORD_TOKEN); })();
