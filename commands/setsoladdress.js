const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');
const fs = require('fs'), path = require('path');
const ADDR_FILE = path.join('/tmp','sol_address.txt');
module.exports = {
  data: new SlashCommandBuilder().setName('setsoladdress').setDescription('🔧  Owner: set the SOL wallet address')
    .addStringOption(o=>o.setName('address').setDescription('Solana address').setRequired(true)),
  async execute(interaction){
    if(interaction.user.id!==process.env.OWNER_ID)return interaction.reply({content:'🚫  Owner only.',ephemeral:true});
    const address=interaction.options.getString('address');
    if(address.length<32||address.length>44)return interaction.reply({content:'❌  Invalid SOL address.',ephemeral:true});
    fs.writeFileSync(ADDR_FILE,address,'utf8');
    process.env.SOL_ADDRESS=address;
    await interaction.reply({embeds:[em('Konvault\' SOL Wallet','✅  SOL address set!\n\n`'+address+'`')],ephemeral:true});
  },
};
