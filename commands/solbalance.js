const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');
const fs = require('fs');

function getAddress() {
  try { return fs.readFileSync('./sol_address.txt', 'utf8').trim(); } catch { return null; }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('solbalance')
    .setDescription('💜  Check the Konvert Flips SOL wallet balance'),

  async execute(interaction) {
    const address = getAddress();
    if (!address) {
      return interaction.reply({ content: '⚠️  No SOL address set. Use `/setsoladdress` to set one.', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const [balRes, priceRes, txRes] = await Promise.all([
        fetch('https://api.mainnet-beta.solana.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address] }),
        }),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'),
        fetch('https://api.mainnet-beta.solana.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSignaturesForAddress', params: [address, { limit: 10 }] }),
        }),
      ]);

      const balData   = await balRes.json();
      const priceData = await priceRes.json();
      const txData    = await txRes.json();

      if (balData.error) return interaction.editReply({ content: '❌  API error: ' + balData.error.message });

      const solPrice = priceData?.solana?.usd ?? 0;
      const solBal   = (balData.result?.value ?? 0) / 1e9;
      const toUSD    = sol => '$' + (sol * solPrice).toFixed(2);
      const txList   = txData.result ?? [];

      const txLines = txList.slice(0, 5).map(tx => {
        const status = tx.err ? '❌' : '✅';
        const date   = tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleDateString() : 'Pending';
        const sig    = tx.signature.slice(0, 8) + '...' + tx.signature.slice(-8);
        return status + '  `' + sig + '`  •  ' + date;
      });

      const lines = [
        '`' + address + '`',
        '',
        '**SOL Price:** `$' + solPrice.toFixed(2) + '`',
        '',
        '💜  **Balance**',
        '`' + solBal.toFixed(9) + ' SOL`  •  `' + toUSD(solBal) + '`',
        '',
        '🔁  **Transactions:** `' + txList.length + '+`',
      ];

      if (txLines.length > 0) {
        lines.push('', '**Last 5 Transactions**', ...txLines);
      } else {
        lines.push('', '📭  No transactions found');
      }

      lines.push('', '[View on Solscan](https://solscan.io/account/' + address + ')');

      await interaction.editReply({ embeds: [em('Konvert Flips\' SOL Wallet', lines.join('\n'))] });

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '❌  Failed to fetch SOL data. Try again.' });
    }
  },
};
