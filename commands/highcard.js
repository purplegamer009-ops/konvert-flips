const { SlashCommandBuilder } = require('discord.js');
const { em, wait, generateFairRoll } = require('../utils/theme');
const { storeProof, verifyRow } = require('../utils/verifyButton');

const SUITS=['♠️','♥️','♦️','♣️'];
const VALS=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

module.exports = {
  data: new SlashCommandBuilder().setName('highcard').setDescription('🃏  Draw a random card'),
  async execute(interaction) {
    await interaction.deferReply();
    await interaction.editReply({ embeds: [em('Konvault\' High Card', '🃏  Drawing...', null, 'highcard')] });
    await wait(1000);

    const valRoll = generateFairRoll(0, 12);
    const suitRoll = generateFairRoll(0, 3);
    const card = VALS[valRoll.result] + SUITS[suitRoll.result];

    const proofId = storeProof(interaction.channelId, {
      id: Date.now() + '_hc',
      game: 'High Card',
      result: card,
      userId: interaction.user.id,
      serverSeed: valRoll.serverSeed,
      clientSeed: valRoll.clientSeed,
      nonce: valRoll.nonce,
    });

    await interaction.editReply({
      embeds: [em('Konvault\' High Card', '**' + interaction.user.displayName + '** drew **' + card + '**', null, 'highcard')],
      components: [verifyRow(proofId)],
    });
  },
};
