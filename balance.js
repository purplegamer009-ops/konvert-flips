const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('💰  Check the Konvert Flips LTC wallet balance'),

  async execute(interaction) {
    const address = process.env.LTC_ADDRESS;
    if (!address) {
      return interaction.reply({ content: '⚠️  No LTC address set. Use `/setaddress` to set one.', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const res = await fetch('https://api.blockcypher.com/v1/ltc/main/addrs/' + address + '/balance');
      const data = await res.json();

      if (data.error) {
        return interaction.editReply({ content: '❌  Invalid address or API error: ' + data.error });
      }

      const confirmed   = (data.balance / 1e8).toFixed(8);
      const unconfirmed = (data.unconfirmed_balance / 1e8).toFixed(8);
      const totalRecv   = (data.total_received / 1e8).toFixed(8);
      const totalSent   = (data.total_sent / 1e8).toFixed(8);
      const txCount     = data.n_tx;

      await interaction.editReply({ embeds: [em(
        'Konvert Flips\' LTC Wallet',
        [
          '`' + address + '`',
          '',
          '💰  **Confirmed Balance:** `' + confirmed + ' LTC`',
          '⏳  **Pending:** `' + unconfirmed + ' LTC`',
          '',
          '📥  **Total Received:** `' + totalRecv + ' LTC`',
          '📤  **Total Sent:** `' + totalSent + ' LTC`',
          '🔁  **Transactions:** `' + txCount + '`',
          '',
          '[View on Blockchain](https://live.blockcypher.com/ltc/address/' + address + '/)',
        ].join('\n')
      )] });

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '❌  Failed to fetch balance. Try again.' });
    }
  },
};
