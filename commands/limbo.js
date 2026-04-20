const { SlashCommandBuilder } = require('discord.js');
const { em, wait, hmacFloat, hmacFloat2, generateFairRoll } = require('../utils/theme');
const { storeProof, verifyRow } = require('../utils/verifyButton');

function roll() {
  const r = hmacFloat();
  if (r < 0.01) return hmacFloat2(50, 100);
  if (r < 0.05) return hmacFloat2(20, 50);
  if (r < 0.15) return hmacFloat2(10, 20);
  if (r < 0.35) return hmacFloat2(5, 10);
  if (r < 0.65) return hmacFloat2(2, 5);
  return hmacFloat2(1, 2);
}

module.exports = {
  data: new SlashCommandBuilder().setName('limbo').setDescription('🚀  Launch into Limbo'),
  async execute(interaction) {
    await interaction.deferReply();
    await interaction.editReply({ embeds: [em('Konvault\' Limbo', '🚀  Launching...', null, 'limbo')] });
    await wait(1000);

    const fairRoll = generateFairRoll(1, 10000);
    const m = roll();

    const proofId = storeProof(interaction.channelId, {
      id: Date.now() + '_limbo',
      game: 'Limbo',
      result: m + 'x',
      userId: interaction.user.id,
      serverSeed: fairRoll.serverSeed,
      clientSeed: fairRoll.clientSeed,
      nonce: fairRoll.nonce,
    });

    await interaction.editReply({
      embeds: [em('Konvault\' Limbo', '**' + interaction.user.displayName + '** landed on **' + m + 'x**', null, 'limbo')],
      components: [verifyRow(proofId)],
    });
  },
};
