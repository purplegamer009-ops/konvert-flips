const { SlashCommandBuilder } = require('discord.js');
const { em, wait, generateFairRoll } = require('../utils/theme');
const { storeProof, verifyRow } = require('../utils/verifyButton');

module.exports = {
  data: new SlashCommandBuilder().setName('coinflip').setDescription('🪙  Flip a coin'),
  async execute(interaction) {
    await interaction.deferReply();
    await interaction.editReply({ embeds: [em('Konvault\' Coinflip', '🪙  Flipping...', null, 'coinflip')] });
    await wait(1000);
    const roll = generateFairRoll(1, 2);
    const result = roll.result === 1 ? 'HEADS' : 'TAILS';
    const proofId = storeProof(interaction.channelId, {
      id: Date.now() + '_cf',
      game: 'Coinflip',
      result,
      userId: interaction.user.id,
      serverSeed: roll.serverSeed,
      clientSeed: roll.clientSeed,
      nonce: roll.nonce,
    });
    await interaction.editReply({
      embeds: [em('Konvault\' Coinflip', (result==='HEADS'?'🟡':'⚪')+'  **'+result+'**', null, 'coinflip')],
      components: [verifyRow(proofId)],
    });
  },
};
