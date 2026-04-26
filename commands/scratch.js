const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { wait, hmacRoll, generateFairRoll, IMAGES, PURPLE } = require('../utils/theme');
const { storeProof, verifyFooter } = require('../utils/verifyButton');
const PRIZES=[{s:'💎',t:5,c:1},{s:'🏆',t:4,c:3},{s:'💰',t:3,c:8},{s:'⭐',t:2,c:15},{s:'🎯',t:1,c:25},{s:'❌',t:0,c:48}];
function rp(){const tot=PRIZES.reduce((a,b)=>a+b.c,0);const r=hmacRoll(1,tot);let c=0;for(const p of PRIZES){c+=p.c;if(r<=c)return p;}return PRIZES[PRIZES.length-1];}
module.exports = {
  data: new SlashCommandBuilder().setName('scratch').setDescription('🎟️ Scratch a card'),
  async execute(interaction) {
    await interaction.deferReply();
    const [p1,p2,p3]=[rp(),rp(),rp()];
    const match=p1.s===p2.s&&p2.s===p3.s;
    await wait(800);
    let line='❌ No match';
    if(match&&p1.t===5)line='💎 TRIPLE DIAMOND — Jackpot!';
    else if(match&&p1.t===4)line='🏆 Triple Trophy!';
    else if(match&&p1.t===3)line='💰 Triple Money Bag!';
    else if(match&&p1.t===2)line='⭐ Triple Star!';
    else if(match&&p1.t===1)line='🎯 Triple Bullseye!';
    else if(match)line='❌ Triple nothing';
    const fair=generateFairRoll(1,100);
    const proofId=storeProof(interaction.channelId,{id:Date.now()+'_scratch',game:'Scratch',result:p1.s+p2.s+p3.s,userId:interaction.user.id,serverSeed:fair.serverSeed,clientSeed:fair.clientSeed,nonce:fair.nonce});
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(match&&p1.t>0?0x00E676:PURPLE)
      .setDescription(p1.s+'  '+p2.s+'  '+p3.s+'\n'+line+verifyFooter(proofId))
      .setThumbnail(match&&p1.t>=5?IMAGES.jackpot:IMAGES.scratch).setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })] });
  },
};
