const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { wait, hmacFloat, hmacFloat2, generateFairRoll, IMAGES, PURPLE } = require('../utils/theme');
const { storeProof, verifyFooter } = require('../utils/verifyButton');
function roll(){const r=hmacFloat();if(r<0.01)return hmacFloat2(50,100);if(r<0.05)return hmacFloat2(20,50);if(r<0.15)return hmacFloat2(10,20);if(r<0.35)return hmacFloat2(5,10);if(r<0.65)return hmacFloat2(2,5);return hmacFloat2(1,2);}
module.exports = {
  data: new SlashCommandBuilder().setName('limbo').setDescription('🚀 Launch into Limbo'),
  async execute(interaction) {
    await interaction.deferReply();
    const m = roll(); const fair = generateFairRoll(1, 10000);
    await wait(800);
    const proofId = storeProof(interaction.channelId, { id: Date.now() + '_limbo', game: 'Limbo', result: m + 'x', userId: interaction.user.id, serverSeed: fair.serverSeed, clientSeed: fair.clientSeed, nonce: fair.nonce });
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(PURPLE)
      .setDescription('🚀 **' + interaction.user.displayName + '** landed on **' + m + 'x**' + verifyFooter(proofId))
      .setThumbnail(IMAGES.limbo).setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })] });
  },
};
