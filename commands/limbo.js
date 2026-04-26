const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { wait, hmacFloat, hmacFloat2, generateFairRoll, IMAGES, PURPLE } = require('../utils/theme');
const { storeProof, verifyRow } = require('../utils/verifyButton');
function roll(){const r=hmacFloat();if(r<0.01)return hmacFloat2(50,100);if(r<0.05)return hmacFloat2(20,50);if(r<0.15)return hmacFloat2(10,20);if(r<0.35)return hmacFloat2(5,10);if(r<0.65)return hmacFloat2(2,5);return hmacFloat2(1,2);}
module.exports = {
  data: new SlashCommandBuilder().setName('limbo').setDescription('🚀 Launch into Limbo'),
  async execute(interaction) {
    await interaction.deferReply();
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(PURPLE).setDescription('🚀  Launching...').setThumbnail(IMAGES.limbo).setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })] });
    await wait(900);
    const m = roll(); const fair = generateFairRoll(1, 10000);
    const color = m >= 10 ? 0xFFD700 : m >= 3 ? 0x00E676 : PURPLE;
    const proofId = storeProof(interaction.channelId, { id: Date.now() + '_limbo', game: 'Limbo', result: m + 'x', userId: interaction.user.id, serverSeed: fair.serverSeed, clientSeed: fair.clientSeed, nonce: fair.nonce });
    await interaction.editReply({
      embeds: [new EmbedBuilder()
        .setColor(color)
        .setTitle('🚀  Limbo')
        .setThumbnail(IMAGES.limbo)
        .setDescription('**' + interaction.user.displayName + '** launched into limbo')
        .addFields(
          { name: 'Multiplier', value: '**' + m + 'x**', inline: true },
          { name: 'Result', value: m >= 2 ? '✅ Win' : '❌ Loss', inline: true },
        )
        .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
        .setTimestamp()
      ],
      components: [verifyRow(proofId)],
    });
  },
};
