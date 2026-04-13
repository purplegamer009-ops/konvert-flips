const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { em, wait } = require('../utils/theme');
const { log } = require('../utils/logger');

const PRIZES = [{s:'💎',t:5,c:1},{s:'🏆',t:4,c:3},{s:'💰',t:3,c:8},{s:'⭐',t:2,c:15},{s:'🎯',t:1,c:25},{s:'❌',t:0,c:48}];
function rollPrize() {
  const tot = PRIZES.reduce((a,b)=>a+b.c,0);
  let r = Math.random()*tot;
  for (const p of PRIZES) { r-=p.c; if(r<=0) return p; }
  return PRIZES[PRIZES.length-1];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scratch')
    .setDescription('🎟️  Scratch a lottery card'),

  async execute(interaction, client) {
    const [p1,p2,p3] = [rollPrize(), rollPrize(), rollPrize()];
    const match = p1.s===p2.s && p2.s===p3.s;
    const result = match && p1.t>0 ? 'WIN' : 'LOSS';

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`scratch_${interaction.id}`)
        .setLabel('🪙  Scratch!')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      embeds: [em('Konvert Flips\' Scratch Card', '🂠  🂠  🂠\n\nPress **Scratch!** to reveal')],
      components: [row],
      fetchReply: true,
    });

    const filter = b => b.customId === `scratch_${interaction.id}` && b.user.id === interaction.user.id;
    
    try {
      const btn = await interaction.channel.awaitMessageComponent({ filter, time: 30_000 });
      await btn.deferUpdate();
      
      await interaction.editReply({
        embeds: [em('Konvert Flips\' Scratch Card', '✨  ✨  ✨\n\nRevealing...')],
        components: [],
      });
      await wait(900);

      await interaction.editReply({
        embeds: [em(
          'Konvert Flips\' Scratch Card',
          `${p1.s}  ${p2.s}  ${p3.s}\n\n${match && p1.t>0
            ? `🏆  **${interaction.user.displayName}** matched **${p1.s} ${p1.s} ${p1.s}**!`
            : '❌  No match'}`
        )],
        components: [],
      });

      await log(client, {
        user: interaction.user,
        game: 'Scratch Card',
        result,
        detail: `${p1.s} ${p2.s} ${p3.s}  —  ${match ? 'Triple match' : 'No match'}`,
      });

    } catch {
      await interaction.editReply({
        embeds: [em('Konvert Flips\' Scratch Card', '⏰  Expired — use `/scratch` for a new card')],
        components: [],
      }).catch(()=>{});
    }
  },
};