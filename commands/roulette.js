const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { wait, generateFairRoll, IMAGES, PURPLE } = require('../utils/theme');
const { storeProof, verifyFooter } = require('../utils/verifyButton');
const BOARD=[{n:0,c:'green'},{n:1,c:'red'},{n:2,c:'black'},{n:3,c:'red'},{n:4,c:'black'},{n:5,c:'red'},{n:6,c:'black'},{n:7,c:'red'},{n:8,c:'black'},{n:9,c:'red'},{n:10,c:'black'},{n:11,c:'black'},{n:12,c:'red'},{n:13,c:'black'},{n:14,c:'red'},{n:15,c:'black'},{n:16,c:'red'},{n:17,c:'black'},{n:18,c:'red'},{n:19,c:'red'},{n:20,c:'black'},{n:21,c:'red'},{n:22,c:'black'},{n:23,c:'red'},{n:24,c:'black'},{n:25,c:'red'},{n:26,c:'black'},{n:27,c:'red'},{n:28,c:'black'},{n:29,c:'black'},{n:30,c:'red'},{n:31,c:'black'},{n:32,c:'red'},{n:33,c:'black'},{n:34,c:'red'},{n:35,c:'black'},{n:36,c:'red'}];
const CE={red:'🔴',black:'⚫',green:'🟢'};
module.exports = {
  data: new SlashCommandBuilder().setName('roulette').setDescription('🎡 Spin the wheel')
    .addStringOption(o=>o.setName('bet').setDescription('Your bet').setRequired(true).addChoices(
      {name:'🔴 Red',value:'red'},{name:'⚫ Black',value:'black'},{name:'🟢 Green',value:'green'},
      {name:'Odd',value:'odd'},{name:'Even',value:'even'},{name:'Low 1-18',value:'low'},{name:'High 19-36',value:'high'}
    )),
  async execute(interaction) {
    const bet=interaction.options.getString('bet');
    await interaction.deferReply();
    const fair=generateFairRoll(0,BOARD.length-1);
    const p=BOARD[fair.result];
    await wait(800);
    let won=false;
    switch(bet){case 'red':won=p.c==='red';break;case 'black':won=p.c==='black';break;case 'green':won=p.c==='green';break;case 'odd':won=p.n>0&&p.n%2!==0;break;case 'even':won=p.n>0&&p.n%2===0;break;case 'low':won=p.n>=1&&p.n<=18;break;case 'high':won=p.n>=19;break;}
    const proofId=storeProof(interaction.channelId,{id:Date.now()+'_roulette',game:'Roulette',result:CE[p.c]+' '+p.n+' ('+bet+')',userId:interaction.user.id,serverSeed:fair.serverSeed,clientSeed:fair.clientSeed,nonce:fair.nonce});
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(won?0x00E676:0xFF1744)
      .setDescription(CE[p.c]+'  **'+p.n+' '+p.c.toUpperCase()+'** — '+(won?'✅ win':'❌ loss')+verifyFooter(proofId))
      .setThumbnail(IMAGES.roulette).setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })] });
  },
};
