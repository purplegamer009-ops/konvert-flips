require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials, EmbedBuilder } = require('discord.js');
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

const LTC_FILE = path.join('/tmp','ltc_address.txt');
const SOL_FILE = path.join('/tmp','sol_address.txt');
if (fs.existsSync(LTC_FILE)) process.env.LTC_ADDRESS = fs.readFileSync(LTC_FILE,'utf8').trim();
if (fs.existsSync(SOL_FILE)) process.env.SOL_ADDRESS = fs.readFileSync(SOL_FILE,'utf8').trim();
if (process.env.LTC_ADDRESS && !fs.existsSync(LTC_FILE)) fs.writeFileSync(LTC_FILE, process.env.LTC_ADDRESS, 'utf8');
if (process.env.SOL_ADDRESS && !fs.existsSync(SOL_FILE)) fs.writeFileSync(SOL_FILE, process.env.SOL_ADDRESS, 'utf8');

for (const file of fs.readdirSync('./commands').filter(f => f.endsWith('.js'))) {
  const cmd = require('./commands/' + file);
  if (cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
}

client.once('ready', function() {
  console.log('🎰 Konvault™ online as ' + client.user.tag);
  client.user.setPresence({ status: 'online', activities: [{ name: '/dice /rps /tower /crash /verify', type: 0 }] });
});

const { registerVerifyHandler } = require('./utils/verifyButton');
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
    console.error(err);
    try { const r={content:'❌ Something went wrong.',ephemeral:true}; if(i.replied||i.deferred)await i.followUp(r);else await i.reply(r); } catch {}
  }
});

const { generateFairRoll, IMAGES, PURPLE } = require('./utils/theme');
const { storeProof, verifyRow } = require('./utils/verifyButton');
const { recordResult, getStats } = require('./utils/stats');

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

  // Defeats tracker
  if (msg.author.id === process.env.OWNER_ID && DEFEATS_CHANNELS.includes(msg.channelId)) {
    const m = content.match(/^<@!?(\d+)>\s+defeats\s+<@!?(\d+)>\s+(\d+(?:\.\d+)?)v(\d+(?:\.\d+)?)$/i);
    if (m) {
      const winnerId=m[1],loserId=m[2],winAmt=parseFloat(m[3]),loseAmt=parseFloat(m[4]);
      recordResult(winnerId, loserId, winAmt);
      const w=getStats(winnerId),l=getStats(loserId);
      const pnl=n=>(n>=0?'+$':'-$')+Math.abs(n).toFixed(2);
      await msg.channel.send({embeds:[new EmbedBuilder().setColor(0x00E676)
        .setTitle('🏆  Result Logged')
        .setThumbnail(IMAGES.logo)
        .setDescription('<@'+winnerId+'> defeated <@'+loserId+'>')
        .addFields(
          { name: '🏆 Winner', value: '<@'+winnerId+'>\n+$'+winAmt.toFixed(2)+'\n'+w.wins+'W '+w.losses+'L  •  **'+pnl(w.pnl)+'**', inline: true },
          { name: '💀 Loser', value: '<@'+loserId+'>\n-$'+loseAmt.toFixed(2)+'\n'+l.wins+'W '+l.losses+'L  •  **'+pnl(l.pnl)+'**', inline: true },
        )
        .setFooter({text:'KONVAULT™',iconURL:IMAGES.logo}).setTimestamp()]});
      return;
    }
  }

  // ?dice / ?roll
  if (lower === '?dice' || lower === '?roll') {
    const r1=generateFairRoll(1,6),r2=generateFairRoll(1,6);
    const proofId=storeProof(msg.channelId,{id:Date.now()+'_dt',game:'Dice',result:r1.result+' & '+r2.result,userId:msg.author.id,serverSeed:r1.serverSeed,clientSeed:r1.clientSeed,nonce:r1.nonce});
    await msg.channel.send({
      embeds:[new EmbedBuilder().setColor(PURPLE)
        .setTitle('🎲  Dice Roll')
        .setThumbnail(IMAGES.dice)
        .setDescription('**'+msg.author.displayName+'** rolled the dice')
        .addFields({name:'Die 1',value:'**'+r1.result+'**',inline:true},{name:'Die 2',value:'**'+r2.result+'**',inline:true},{name:'Total',value:'**'+(r1.result+r2.result)+'**',inline:true})
        .setFooter({text:'KONVAULT™',iconURL:IMAGES.logo}).setTimestamp()],
      components:[verifyRow(proofId)],
    });
    return;
  }

  // ?cf
  if (lower === '?cf') {
    const roll=generateFairRoll(1,2);
    const result=roll.result===1?'HEADS':'TAILS';
    const proofId=storeProof(msg.channelId,{id:Date.now()+'_cft',game:'Coinflip',result,userId:msg.author.id,serverSeed:roll.serverSeed,clientSeed:roll.clientSeed,nonce:roll.nonce});
    await msg.channel.send({
      embeds:[new EmbedBuilder().setColor(PURPLE)
        .setTitle('🪙  Coin Flip')
        .setThumbnail(IMAGES.coinflip)
        .setDescription('**'+msg.author.displayName+'** flipped a coin')
        .addFields({name:'Result',value:(result==='HEADS'?'🟡':'⚪')+' **'+result+'**',inline:true})
        .setFooter({text:'KONVAULT™',iconURL:IMAGES.logo}).setTimestamp()],
      components:[verifyRow(proofId)],
    });
    return;
  }

  // $BTC $ETH etc
  if (content.startsWith('$') && content.length > 1 && !content.includes(' ')) {
    const ticker=content.slice(1).toLowerCase();
    const coinId=COIN_IDS[ticker];
    if (!coinId) return;
    try {
      const res=await fetch('https://api.coingecko.com/api/v3/coins/'+coinId+'?localization=false&tickers=false&community_data=false&developer_data=false');
      const data=await res.json();
      const price=data.market_data.current_price.usd,change24=data.market_data.price_change_percentage_24h;
      const high24=data.market_data.high_24h.usd,low24=data.market_data.low_24h.usd;
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
        .setFooter({text:'KONVAULT™  •  Live Price',iconURL:IMAGES.logo}).setTimestamp()]});
    } catch(e) { console.error(e); }
    return;
  }
});

(async function() { await deployCommands(); client.login(process.env.DISCORD_TOKEN); })();
