const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { wait, hmacRoll, generateFairRoll, IMAGES, PURPLE } = require('../utils/theme');
const { storeProof, verifyRow } = require('../utils/verifyButton');
const PRIZES=[{s:'💎',t:5,c:1},{s:'🏆',t:4,c:3},{s:'💰',t:3,c:8},{s:'⭐',t:2,c:15},{s:'🎯',t:1,c:25},{s:'❌',t:0,c:48}];
function rp(){const tot=PRIZES.reduce((a,b)=>a+b.c,0);const r=hmacRoll(1,tot);let c=0;for(const p of PRIZES){c+=p.c;if(r<=c)return p;}return PRIZES[PRIZES.length-1];}
module.exports = {
  data: new SlashCommandBuilder().setName('scratch').setDescription('🎟️ Scratch a card'),
  async execute(interaction) {
    await interaction.deferReply();
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(PURPLE).setDescription('🎟️  Scratching...').setThumbnail(IMAGES.scratch).setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })] });
    await wait(900);
    const [p1,p2,p3]=[rp(),rp(),rp()];
    const match = p1.s===p2.s && p2.s===p3.s;
    const won = match && p1.t > 0;
    let prize = 'No Match';
    if(match&&p1.t===5)prize='💎 TRIPLE DIAMOND — Jackpot!';
    else if(match&&p1.t===4)prize='🏆 Triple Trophy';
    else if(match&&p1.t===3)prize='💰 Triple Money Bag';
    else if(match&&p1.t===2)prize='⭐ Triple Star';
    else if(match&&p1.t===1)prize='🎯 Triple Bullseye';
    else if(match)prize='❌ Triple Nothing';
    const fair = generateFairRoll(1, 100);
    const proofId = storeProof(interaction.channelId, { id: Date.now() + '_scratch', game: 'Scratch', result: p1.s+p2.s+p3.s, userId: interaction.user.id, serverSeed: fair.serverSeed, clientSeed: fair.clientSeed, nonce: fair.nonce });
    await interaction.editReply({
      embeds: [new EmbedBuilder()
        .setColor(won ? (p1.t >= 5 ? 0xFFD700 : 0x00E676) : PURPLE)
        .setTitle('🎟️  Scratch Card')
        .setThumbnail(won && p1.t >= 5 ? IMAGES.jackpot : IMAGES.scratch)
        .setDescription('**' + p1.s + '  ' + p2.s + '  ' + p3.s + '**')
        .addFields({ name: 'Result', value: prize, inline: false })
        .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
        .setTimestamp()
      ],
      components: [verifyRow(proofId)],
    });
  },
};
