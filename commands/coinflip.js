const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { wait, generateFairRoll, IMAGES, PURPLE } = require('../utils/theme');
const { storeProof, verifyFooter } = require('../utils/verifyButton');
module.exports = {
  data: new SlashCommandBuilder().setName('coinflip').setDescription('🪙 Flip a coin'),
  async execute(interaction) {
    await interaction.deferReply();
    const roll = generateFairRoll(1, 2);
    const result = roll.result === 1 ? 'HEADS' : 'TAILS';
    await wait(800);
    const proofId = storeProof(interaction.channelId, { id: Date.now() + '_cf', game: 'Coinflip', result, userId: interaction.user.id, serverSeed: roll.serverSeed, clientSeed: roll.clientSeed, nonce: roll.nonce });
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(PURPLE)
      .setDescription((result === 'HEADS' ? '🟡' : '⚪') + '  **' + result + '**' + verifyFooter(proofId))
      .setThumbnail(IMAGES.coinflip).setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })] });
  },
};
