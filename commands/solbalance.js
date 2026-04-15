const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('solbalance')
    .setDescription('💜  Check the Konvert Flips SOL wallet balance'),

  async execute(interaction) {
    const address = process.env.SOL_ADDRESS;
    if (!address) {
      return interaction.reply({ content: '⚠️  No SOL address set. Use `/setsoladdress` to set one.', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      // Fetch balance, price and transactions simultaneously
      const [balRes, priceRes, txRes] = await Promise.all([
        fetch('https://api.mainnet-beta.solana.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 1,
            method: 'getBalance',
            params: [address],
          }),
        }),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'),
        fetch('https://api.mainnet-beta.solana.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 1,
            method: 'getSignaturesForAddress',
            params: [address, { limit: 10 }],
          }),
        }),
      ]);

      const balData   = await balRes.json();
      const priceData = await priceRes.json();
      const txData    = await txRes.json();

      if (balData.error) {
        return interaction.editReply({ content: '❌  API error: ' + balData.error.message });
      }

      const solPrice  = priceData?.solana?.usd ?? 0;
      const solBal    = (balData.result?.value ?? 0) / 1e9;
      const toUSD     = sol => '$' + (sol * solPrice).toFixed(2);
      const txList    = txData.result ?? [];
      const txCount   = txList.length;

      // Build recent transaction list
      const txLines = [];
      for (const tx of txList.slice(0, 5)) {
        const status = tx.err ? '❌' : '✅';
        const date   = tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleDateString() : 'Pending';
        const sig    = tx.signature.slice(0, 8) + '...' + tx.signature.slice(-8);
        txLines.push(status + '  `' + sig + '`  •  ' + date);
      }

      const lines = [
        '`' + address + '`',
        '',
        '**SOL Price:** `$' + solPrice.toFixed(2) + '`',
        '',
        '💜  **Balance**',
        '`' + solBal.toFixed(9) + ' SOL`  •  `' + toUSD(solBal) + '`',
        '',
        '🔁  **Recent Transactions:** `' + txCount + '+`',
      ];

      if (txLines.length > 0) {
        lines.push('');
        lines.push('**Last 5 Transactions**');
        lines.push(...txLines);
      } else {
        lines.push('');
        lines.push('📭  No transactions found');
      }

      lines.push('');
      lines.push('[View on Solscan](https://solscan.io/account/' + address + ')');

      await interaction.editReply({ embeds: [em('Konvert Flips\' SOL Wallet', lines.join('\n'))] });

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '❌  Failed to fetch SOL data. Try again.' });
    }
  },
};
