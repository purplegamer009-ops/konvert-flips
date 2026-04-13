require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { deployCommands } = require('./deploy-commands');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

for (const file of fs.readdirSync('./commands').filter(f => f.endsWith('.js'))) {
  const cmd = require(`./commands/${file}`);
  if (cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
}

client.once('ready', () => {
  console.log(`\n🎰  Konvert Flips™  •  Online as ${client.user.tag}`);
  client.user.setPresence({
    status: 'online',
    activities: [{ name: '/dice /limbo /coinflip /slots /rps /crash /blackjack', type: 0 }],
  });
});

client.on('interactionCreate', async i => {
  if (!i.isChatInputCommand()) return;
  const cmd = client.commands.get(i.commandName);
  if (!cmd) return;
  try { await cmd.execute(i, client); }
  catch (err) {
    console.error(err);
    const r = { content: '❌  Something went wrong.', ephemeral: true };
    i.replied || i.deferred ? i.followUp(r) : i.reply(r);
  }
});

(async () => { await deployCommands(); client.login(process.env.DISCORD_TOKEN); })();
