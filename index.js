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

const LTC_FILE = path.join('/tmp', 'ltc_address.txt');
const SOL_FILE = path.join('/tmp', 'sol_address.txt');
if (fs.existsSync(LTC_FILE)) { process.env.LTC_ADDRESS = fs.readFileSync(LTC_FILE,'utf8').trim(); }
if (fs.existsSync(SOL_FILE)) { process.env.SOL_ADDRESS = fs.readFileSync(SOL_FILE,'utf8').trim(); }
if (process.env.LTC_ADDRESS && !fs.existsSync(LTC_FILE)) fs.writeFileSync(LTC_FILE, process.env.LTC_ADDRESS, 'utf8');
if (process.env.SOL_ADDRESS && !fs.existsSync(SOL_FILE)) fs.writeFileSync(SOL_FILE, process.env.SOL_ADDRESS, 'utf8');

for (const file of fs.readdirSync('./commands').filter(f => f.endsWith('.js'))) {
  const cmd = require(`./commands/${file}`);
  if (cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
}

client.once('ready', () => {
  console.log(`\n🎰  Konvault™  •  Online as ${client.user.tag}`);
  client.user.setPresence({
    status: 'online',
    activities: [{ name: '/dice /limbo /rps /tower /crash /verify', type: 0 }],
  });
});

// Register verify button handler
const { registerVerifyHandler } = require('./utils/verifyButton');
registerVerifyHandler(client);

client.on('interactionCreate', async i => {
  if (!i.isChatInputCommand()) return;
  if (client.blockedChannels.has(i.channelId) && !['lock','unlock','gamechannel','endgame'].includes(i.commandName)) {
    return i.reply({ content: '🔒  Games are disabled in this channel.', ephemeral: true });
  }
  const cmd = client.commands.get(i.commandName);
  if (!cmd) return;
  try { await cmd.execute(i, client); }
  catch (err) {
    console.error(err);
    try {
      const r = { content: '❌  Something went wrong.', ephemeral: true };
      if (i.replied || i.deferred) await i.followUp(r);
      else await i.reply(r);
    } catch {}
  }
});

const { generateFairRoll, em, IMAGES } = require('./utils/theme');
const { storeProof, verifyRow } = require('./utils/verifyButton');
const COIN_IDS = {
  btc:'bitcoin', eth:'ethereum', sol:'solana', ltc:'litecoin',
  xrp:'ripple', bnb:'binancecoin', usdt:'tether', usdc:'usd-coin',
  ada:'cardano', doge:'dogecoin', dot:'polkadot', matic:'matic-network',
  avax:'avalanche-2', link:'chainlink', uni:'uniswap', shib:'shiba-inu',
  trx:'tron', xlm:'stellar', atom:'cosmos', near:'near',
};

client.on('messageCreate', async msg => {
  if (msg.author.bot) return;
  if (client.blockedChannels.has(msg.channelId)) return;
  const content = msg.content.trim();
  const lower = content.toLowerCase();

  if (lower === '?dice' || lower === '?roll') {
    const roll1 = generateFairRoll(1, 6);
    const roll2 = generateFairRoll(1, 6);
    const d1 = roll1.result, d2 = roll2.result;
    const proofId = storeProof(msg.channelId, {
      id: Date.now() + '_dice_text',
      game: 'Dice',
      result: d1 + ' & ' + d2 + ' = ' + (d1+d2),
      userId: msg.author.id,
      serverSeed: roll1.serverSeed,
      clientSeed: roll1.clientSeed,
      nonce: roll1.nonce,
    });
    await msg.channel.send({
      embeds: [em('Konvault\' Dice Roll', '**'+msg.author.displayName+'** rolled **'+d1+'** & **'+d2+'**\n\nTotal: **'+(d1+d2)+'**', null, 'dice')],
      components: [verifyRow(proofId)],
    });
    return;
  }

  if (lower === '?cf') {
    const roll = generateFairRoll(1, 2);
    const result = roll.result === 1 ? 'HEADS' : 'TAILS';
    const proofId = storeProof(msg.channelId, {
      id: Date.now() + '_cf_text',
      game: 'Coinflip',
      result,
      userId: msg.author.id,
      serverSeed: roll.serverSeed,
      clientSeed: roll.clientSeed,
      nonce: roll.nonce,
    });
    await msg.channel.send({
      embeds: [em('Konvault\' Coinflip', (result==='HEADS'?'🟡':'⚪')+'  **'+result+'**', null, 'coinflip')],
      components: [verifyRow(proofId)],
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
      const price = data.market_data.current_price.usd;
      const change24 = data.market_data.price_change_percentage_24h;
      const high24 = data.market_data.high_24h.usd;
      const low24 = data.market_data.low_24h.usd;
      const color = change24 >= 0 ? 0x00E676 : 0xFF1744;
      const pct = n => (n>=0?'▲ +':'▼ ')+n.toFixed(2)+'%';
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(data.name+'  ('+ticker.toUpperCase()+')')
        .setDescription('# $'+price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:8}))
        .setThumbnail(data.image?.small||IMAGES.logo)
        .setImage(IMAGES.price)
        .addFields(
          {name:'24h Change',value:'`'+pct(change24)+'`',inline:true},
          {name:'24h High',value:'`$'+high24.toLocaleString()+'`',inline:true},
          {name:'24h Low',value:'`$'+low24.toLocaleString()+'`',inline:true},
        )
        .setTimestamp()
        .setFooter({text:'KONVAULT™  •  Live Price',iconURL:IMAGES.logo});
      await msg.channel.send({ embeds: [embed] });
    } catch(err){console.error(err);}
    return;
  }
});

(async () => { await deployCommands(); client.login(process.env.DISCORD_TOKEN); })();
