const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setaddress')
    .setDescription('🔧  Owner: set the LTC wallet address')
    .addStringOption(o => o.setName('address').setDescription('The Litecoin address').setRequired(true)),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({ content: '🚫  Owner only.', ephemeral: true });
    }
    const address = interaction.options.getString('address');
    if (!address.startsWith('L') && !address.startsWith('M') && !address.startsWith('ltc1')) {
      return interaction.reply({ content: '❌  Invalid LTC address. Must start with `L`, `M`, or `ltc1`.', ephemeral: true });
    }
    fs.writeFileSync('./ltc_address.txt', address, 'utf8');
    await interaction.reply({ embeds: [em('Konvert Flips\' LTC Wallet', '✅  LTC address set!\n\n`' + address + '`\n\nUse `/balance` to check it.')], ephemeral: true });
  },
};
