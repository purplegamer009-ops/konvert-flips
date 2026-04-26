const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { wait, generateFairRoll, IMAGES, PURPLE } = require('../utils/theme');
const { storeProof, verifyRow } = require('../utils/verifyButton');
module.exports = {
  data: new SlashCommandBuilder().setName('coinflip').setDescription('🪙 Flip a coin'),
  async execute(interaction) {
    await interaction.deferReply();
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(PURPLE).setDescription('🪙  Flipping...').setThumbnail(IMAGES.coinflip).setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })] });
    await wait(900);
    const roll = generateFairRoll(1, 2);
    const result = roll.result === 1 ? 'HEADS' : 'TAILS';
    const proofId = storeProof(interaction.channelId, { id: Date.now() + '_cf', game: 'Coinflip', result, userId: interaction.user.id, serverSeed: roll.serverSeed, clientSeed: roll.clientSeed, nonce: roll.nonce });
    await interaction.editReply({
      embeds: [new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle('🪙  Coin Flip')
        .setThumbnail(IMAGES.coinflip)
        .setDescription((result === 'HEADS' ? '🟡' : '⚪') + '  **' + result + '**')
        .addFields({ name: 'Player', value: interaction.user.displayName, inline: true }, { name: 'Result', value: result, inline: true })
        .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
        .setTimestamp()
      ],
      components: [verifyRow(proofId)],
    });
  },
};
