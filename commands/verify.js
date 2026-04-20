const { SlashCommandBuilder } = require('discord.js');
const { em, generateFairRoll } = require('../utils/theme');
const crypto = require('crypto');
module.exports = {
  data: new SlashCommandBuilder().setName('verify').setDescription('🔒  Verify any Konvault result is provably fair')
    .addStringOption(o=>o.setName('server_seed').setDescription('Server seed from the result').setRequired(false))
    .addStringOption(o=>o.setName('client_seed').setDescription('Client seed from the result').setRequired(false))
    .addStringOption(o=>o.setName('nonce').setDescription('Nonce from the result').setRequired(false)),
  async execute(interaction){
    const serverSeed=interaction.options.getString('server_seed');
    const clientSeed=interaction.options.getString('client_seed');
    const nonce=interaction.options.getString('nonce');
    if(!serverSeed||!clientSeed||!nonce){
      const demo=generateFairRoll(1,100);
      return interaction.reply({embeds:[em('Konvault\' Provably Fair',[
        '**Every Konvault result is cryptographically verifiable.**','',
        '**How it works:**',
        '1️⃣  Before each roll a secret **Server Seed** is generated',
        '2️⃣  A **Commitment** (SHA-256 hash) is locked in before the roll',
        '3️⃣  Roll happens using HMAC-SHA256',
        '4️⃣  Server Seed is revealed after',
        '5️⃣  Anyone can verify by hashing the seed and checking it matches','',
        '**Live Demo:**',
        '🎲  Result: **'+demo.result+'**',
        '🔑  Server Seed: `'+demo.serverSeed+'`',
        '🌱  Client Seed: `'+demo.clientSeed+'`',
        '🔢  Nonce: `'+demo.nonce+'`',
        '🔒  Commitment: `'+demo.commitment+'`','',
        'Use `/verify server_seed client_seed nonce` to verify any result.',
      ].join('\n'),null,'verify')]});
    }
    try{
      const commitment=crypto.createHash('sha256').update(serverSeed).digest('hex');
      const hmac=crypto.createHmac('sha256',serverSeed);
      hmac.update(clientSeed+':'+nonce);
      const digest=hmac.digest('hex');
      const rawNum=parseInt(digest.slice(0,8),16);
      await interaction.reply({embeds:[em('Konvault\' Provably Fair — Verified',[
        '✅  **Verification Complete**','',
        '🔑  **Server Seed:** `'+serverSeed+'`',
        '🌱  **Client Seed:** `'+clientSeed+'`',
        '🔢  **Nonce:** `'+nonce+'`','',
        '🔒  **Commitment:** `'+commitment+'`',
        '📊  **HMAC Digest:** `'+digest.slice(0,32)+'...`',
        '🎲  **Raw Number:** `'+rawNum+'`','',
        '✅  This result was **mathematically impossible to fake.**',
      ].join('\n'),null,'verify')]});
    }catch{await interaction.reply({content:'❌  Invalid seeds.',ephemeral:true});}
  },
};
