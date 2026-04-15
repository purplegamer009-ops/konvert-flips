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
      // Fetch balance and transaction data simultaneously
      const [balRes, priceRes, txRes] = await Promise.all([
        fetch('https://api.blockcypher.com/v1/ltc/main/addrs/' + address + '/balance'),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd'),
        fetch('https://api.blockcypher.com/v1/ltc/main/addrs/' + address + '?limit=10'),
      ]);

      const balData  = await balRes.json();
      const priceData = await priceRes.json();
      const txData   = await txRes.json();

      if (balData.error) {
        return interaction.editReply({ content: '❌  API error: ' + balData.error });
      }

      const ltcPrice    = priceData?.litecoin?.usd ?? 0;
      const confirmed   = balData.balance / 1e8;
      const unconfirmed = balData.unconfirmed_balance / 1e8;
      const totalRecv   = balData.total_received / 1e8;
      const totalSent   = balData.total_sent / 1e8;
      const txCount     = balData.n_tx;

      const toUSD = ltc => '$' + (ltc * ltcPrice).toFixed(2);

      // Build incoming transaction list
      const txLines = [];
      if (txData.txrefs && txData.txrefs.length > 0) {
        const incoming = txData.txrefs
          .filter(tx => !tx.spent)
          .slice(0, 5);

        for (const tx of incoming) {
          const ltcAmt = (tx.value / 1e8).toFixed(8);
          const usdAmt = toUSD(tx.value / 1e8);
          const confirmed = tx.confirmations > 0 ? '✅' : '⏳';
          const date = new Date(tx.confirmed || tx.received).toLocaleDateString();
          txLines.push(confirmed + '  `' + ltcAmt + ' LTC` (' + usdAmt + ')  •  ' + date);
        }
      }

      const lines = [
        '`' + address + '`',
        '',
        '**LTC Price:** `$' + ltcPrice.toFixed(2) + '`',
        '',
        '💰  **Confirmed Balance**',
        '`' + confirmed.toFixed(8) + ' LTC`  •  `' + toUSD(confirmed) + '`',
        '',
        '⏳  **Pending / Unconfirmed**',
        '`' + unconfirmed.toFixed(8) + ' LTC`  •  `' + toUSD(unconfirmed) + '`',
        '',
        '📥  **Total Received**',
        '`' + totalRecv.toFixed(8) + ' LTC`  •  `' + toUSD(totalRecv) + '`',
        '',
        '📤  **Total Sent**',
        '`' + totalSent.toFixed(8) + ' LTC`  •  `' + toUSD(totalSent) + '`',
        '',
        '🔁  **Total Transactions:** `' + txCount + '`',
      ];

      if (txLines.length > 0) {
        lines.push('');
        lines.push('**Recent Incoming Transactions**');
        lines.push(...txLines);
      } else {
        lines.push('');
        lines.push('📭  No incoming transactions found');
      }

      lines.push('');
      lines.push('[View on Blockchain](https://live.blockcypher.com/ltc/address/' + address + '/)');

      await interaction.editReply({ embeds: [em('Konvert Flips\' LTC Wallet', lines.join('\n'))] });

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '❌  Failed to fetch data. Try again.' });
    }
  },
};
