const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setsoladdress')
    .setDescription('🔧  Owner: set the SOL wallet address')
    .addStringOption(o => o.setName('address').setDescription('The Solana address').setRequired(true)),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({ content: '🚫  Owner only.', ephemeral: true });
    }
    const address = interaction.options.getString('address');
    if (address.length < 32 || address.length > 44) {
      return interaction.reply({ content: '❌  Invalid SOL address.', ephemeral: true });
    }
    fs.writeFileSync('./sol_address.txt', address, 'utf8');
    await interaction.reply({ embeds: [em('Konvert Flips\' SOL Wallet', '✅  SOL address set!\n\n`' + address + '`\n\nUse `/solbalance` to check it.')], ephemeral: true });
  },
};
