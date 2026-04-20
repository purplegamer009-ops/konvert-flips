const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');
const fs = require('fs'), path = require('path');
const ADDR_FILE = path.join('/tmp','ltc_address.txt');
module.exports = {
  data: new SlashCommandBuilder().setName('setaddress').setDescription('🔧  Owner: set the LTC wallet address')
    .addStringOption(o=>o.setName('address').setDescription('Litecoin address').setRequired(true)),
  async execute(interaction){
    if(interaction.user.id!==process.env.OWNER_ID)return interaction.reply({content:'🚫  Owner only.',ephemeral:true});
    const address=interaction.options.getString('address');
    if(!address.startsWith('L')&&!address.startsWith('M')&&!address.startsWith('ltc1'))return interaction.reply({content:'❌  Invalid LTC address.',ephemeral:true});
    fs.writeFileSync(ADDR_FILE,address,'utf8');
    process.env.LTC_ADDRESS=address;
    await interaction.reply({embeds:[em('Konvault\' LTC Wallet','✅  LTC address set!\n\n`'+address+'`')],ephemeral:true});
  },
};
