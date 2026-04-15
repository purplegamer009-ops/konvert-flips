const { SlashCommandBuilder } = require('discord.js');
const { em, wait, hmacRoll } = require('../utils/theme');
const PRIZES=[{s:'💎',t:5,c:1},{s:'🏆',t:4,c:3},{s:'💰',t:3,c:8},{s:'⭐',t:2,c:15},{s:'🎯',t:1,c:25},{s:'❌',t:0,c:48}];
function rollPrize(){const total=PRIZES.reduce((a,b)=>a+b.c,0);const roll=hmacRoll(1,total);let c=0;for(const p of PRIZES){c+=p.c;if(roll<=c)return p;}return PRIZES[PRIZES.length-1];}
module.exports = {
  data: new SlashCommandBuilder().setName('scratch').setDescription('🎟️  Scratch a lottery card'),
  async execute(interaction) {
    await interaction.deferReply();
    await interaction.editReply({ embeds: [em('Konvert Flips\' Scratch Card', '🎟️  Scratching...')] });
    await wait(1000);
    const [p1,p2,p3]=[rollPrize(),rollPrize(),rollPrize()];
    const match=p1.s===p2.s&&p2.s===p3.s;
    let line;
    if(match&&p1.t===5)line='💎  **TRIPLE DIAMOND — Jackpot!**';
    else if(match&&p1.t===4)line='🏆  **Triple Trophy!**';
    else if(match&&p1.t===3)line='💰  **Triple Money Bag!**';
    else if(match&&p1.t===2)line='⭐  **Triple Star!**';
    else if(match&&p1.t===1)line='🎯  **Triple Bullseye!**';
    else if(match)line='❌  Triple nothing';
    else line='❌  No match';
    await interaction.editReply({ embeds: [em('Konvert Flips\' Scratch Card', p1.s+'  '+p2.s+'  '+p3.s+'\n\n'+line)] });
  },
};
