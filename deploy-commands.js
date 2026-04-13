require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');

async function deployCommands() {
  const commands = fs.readdirSync('./commands').filter(f => f.endsWith('.js'))
    .map(f => require(`./commands/${f}`).data?.toJSON()).filter(Boolean);
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  console.log(`🔄  Deploying ${commands.length} commands...`);
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
  console.log(`✅  Commands deployed.\n`);
}

module.exports = { deployCommands };
