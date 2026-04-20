const { SlashCommandBuilder } = require('discord.js');
const { em, wait, generateFairRoll } = require('../utils/theme');
const { storeProof, verifyRow } = require('../utils/verifyButton');

module.exports = {
  data: new SlashCommandBuilder().setName('dice').setDescription('🎲  Roll two dice')
    .addIntegerOption(o => o.setName('sides').setDescription('Sides per die (default 6)').setMinValue(2).setMaxValue(100)),
  async execute(interaction) {
    const sides = interaction.options.getInteger('sides') ?? 6;
    await interaction.deferReply();
    await interaction.editReply({ embeds: [em('Konvault\' Dice Roll', '🎲  Rolling...', null, 'dice')] });
    await wait(1000);

    const roll1 = generateFairRoll(1, sides);
    const roll2 = generateFairRoll(1, sides);
    const d1 = roll1.result, d2 = roll2.result;

    const proofId1 = storeProof(interaction.channelId, { id: Date.now() + 'a', game: 'Dice (Die 1)', result: d1, userId: interaction.user.id, serverSeed: roll1.serverSeed, clientSeed: roll1.clientSeed, nonce: roll1.nonce });
    const proofId2 = storeProof(interaction.channelId, { id: Date.now() + 'b', game: 'Dice (Die 2)', result: d2, userId: interaction.user.id, serverSeed: roll2.serverSeed, clientSeed: roll2.clientSeed, nonce: roll2.nonce });

    await interaction.editReply({
      embeds: [em('Konvault\' Dice Roll',
        '**' + interaction.user.displayName + '** rolled **' + d1 + '** & **' + d2 + '**\n\nTotal: **' + (d1+d2) + '**',
        null, 'dice'
      )],
      components: [verifyRow(proofId1)],
    });
  },
};
