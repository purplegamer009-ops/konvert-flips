const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { wait, generateFairRoll, IMAGES, PURPLE } = require('../utils/theme');
const { storeProof, verifyFooter } = require('../utils/verifyButton');
module.exports = {
  data: new SlashCommandBuilder().setName('dice').setDescription('🎲 Roll two dice')
    .addIntegerOption(o => o.setName('sides').setDescription('Sides (default 6)').setMinValue(2).setMaxValue(100)),
  async execute(interaction) {
    await interaction.deferReply();
    const sides = interaction.options.getInteger('sides') ?? 6;
    const r1 = generateFairRoll(1, sides), r2 = generateFairRoll(1, sides);
    await wait(800);
    const proofId = storeProof(interaction.channelId, { id: Date.now() + '_dice', game: 'Dice', result: r1.result + ' & ' + r2.result, userId: interaction.user.id, serverSeed: r1.serverSeed, clientSeed: r1.clientSeed, nonce: r1.nonce });
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(PURPLE)
      .setDescription('**' + interaction.user.displayName + '** rolled **' + r1.result + '** & **' + r2.result + '** — total **' + (r1.result + r2.result) + '**' + verifyFooter(proofId))
      .setThumbnail(IMAGES.dice).setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })] });
  },
};
