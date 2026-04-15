require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const { deployCommands } = require('./deploy-commands');
const fs = require('fs');

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

for (const file of fs.readdirSync('./commands').filter(f => f.endsWith('.js'))) {
  const cmd = require(`./commands/${file}`);
  if (cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
}

client.once('ready', () => {
  console.log(`\n🎰  Konvert Flips™  •  Online as ${client.user.tag}`);
  client.user.setPresence({
    status: 'online',
    activities: [{ name: '/dice /limbo /coinflip /rps /blackjack /crash', type: 0 }],
  });
});

client.on('interactionCreate', async i => {
  if (!i.isChatInputCommand()) return;
  if (client.blockedChannels.has(i.channelId) && i.commandName !== 'lock' && i.commandName !== 'unlock') {
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

const { hmacRoll, em } = require('./utils/theme');
const { log } = require('./utils/logger');
const FACE = ['⚀','⚁','⚂','⚃','⚄','⚅'];

client.on('messageCreate', async msg => {
  if (msg.author.bot) return;
  const cmd = msg.content.toLowerCase().trim();
  if (cmd !== '?dice' && cmd !== '?roll' && cmd !== '?cf') return;
  if (client.blockedChannels.has(msg.channelId)) return;

  if (cmd === '?dice' || cmd === '?roll') {
    const d1 = hmacRoll(1, 6), d2 = hmacRoll(1, 6);
    await msg.channel.send({ embeds: [em(
      'Konvert Flips\' Dice Roll',
      '**' + msg.author.displayName + '** rolled **' + FACE[d1-1] + '** & **' + FACE[d2-1] + '**\n\nTotal: **' + (d1+d2) + '**'
    )] });
    await log(client, { user: msg.author, game: 'Dice', result: 'ROLL', detail: d1 + ' & ' + d2 + ' = ' + (d1+d2) });
    return;
  }

  if (cmd === '?cf') {
    const result = hmacRoll(1, 2) === 1 ? 'HEADS' : 'TAILS';
    await msg.channel.send({ embeds: [em(
      'Konvert Flips\' Coinflip',
      (result === 'HEADS' ? '🟡' : '⚪') + '  **' + result + '**'
    )] });
    await log(client, { user: msg.author, game: 'Coinflip', result: 'FLIP', detail: result });
    return;
  }
});

(async () => { await deployCommands(); client.login(process.env.DISCORD_TOKEN); })();
