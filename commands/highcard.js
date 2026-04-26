const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { wait, generateFairRoll, IMAGES, PURPLE } = require('../utils/theme');
const { storeProof, verifyFooter } = require('../utils/verifyButton');
const SUITS=['♠️','♥️','♦️','♣️'],VALS=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
module.exports = {
  data: new SlashCommandBuilder().setName('highcard').setDescription('🃏 Draw a card'),
  async execute(interaction) {
    await interaction.deferReply();
    const vr=generateFairRoll(0,12),sr=generateFairRoll(0,3);
    const card=VALS[vr.result]+SUITS[sr.result];
    await wait(800);
    const proofId=storeProof(interaction.channelId,{id:Date.now()+'_hc',game:'High Card',result:card,userId:interaction.user.id,serverSeed:vr.serverSeed,clientSeed:vr.clientSeed,nonce:vr.nonce});
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(PURPLE)
      .setDescription('🃏 **' + interaction.user.displayName + '** drew **' + card + '**' + verifyFooter(proofId))
      .setThumbnail(IMAGES.highcard).setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })] });
  },
};
