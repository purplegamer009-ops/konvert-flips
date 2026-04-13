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
  partials: [
    Partials.Channel,
    Partials.Message,
  ],
});

client.commands = new Collection();

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
  const cmd = client.commands.get(i.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(i, client);
  } catch (err) {
    console.error(err);
    try {
      const r = { content: '❌  Something went wrong.', ephemeral: true };
      if (i.replied || i.deferred) await i.followUp(r);
      else await i.reply(r);
    } catch {}
  }
});

(async () => { await deployCommands(); client.login(process.env.DISCORD_TOKEN); })();
