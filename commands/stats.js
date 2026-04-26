const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { IMAGES, PURPLE } = require('../utils/theme');
const { getStats, getAll } = require('../utils/stats');
module.exports = {
  data: new SlashCommandBuilder().setName('stats').setDescription('📊 Player stats or leaderboard')
    .addUserOption(o=>o.setName('user').setDescription('User to check (empty = leaderboard)').setRequired(false)),
  async execute(interaction){
    const target=interaction.options.getUser('user');
    if(target){
      const s=getStats(target.id);
      if(s.wins===0&&s.losses===0)return interaction.reply({content:'📊 No recorded activity for <@'+target.id+'> yet.'});
      const total=s.wins+s.losses;
      const winRate=total>0?((s.wins/total)*100).toFixed(1):'0';
      const pnlStr=(s.pnl>=0?'+$':'-$')+Math.abs(s.pnl).toFixed(2);
      return interaction.reply({embeds:[new EmbedBuilder().setColor(s.pnl>=0?0x00E676:0xFF1744)
        .setTitle('📊 '+target.displayName)
        .setThumbnail(target.displayAvatarURL())
        .setDescription('**P&L:** '+pnlStr+'\n**Record:** '+s.wins+'W '+s.losses+'L ('+winRate+'% win rate)\n**Games:** '+total)
        .setFooter({text:'KONVAULT™',iconURL:IMAGES.logo}).setTimestamp()]});
    }
    const all=getAll();
    if(all.size===0)return interaction.reply({content:'📊 No stats yet. Log results with the defeats tracker.'});
    const sorted=[...all.entries()].sort((a,b)=>b[1].pnl-a[1].pnl);
    const lines=[];
    for(let i=0;i<Math.min(sorted.length,10);i++){
      const[userId,s]=sorted[i];
      const pnlStr=(s.pnl>=0?'+$':'-$')+Math.abs(s.pnl).toFixed(2);
      const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':'`'+(i+1)+'`';
      lines.push(medal+'  <@'+userId+'>  **'+pnlStr+'**  •  '+s.wins+'W '+s.losses+'L');
    }
    const top=sorted[0],bot=sorted[sorted.length-1];
    await interaction.reply({embeds:[new EmbedBuilder().setColor(PURPLE)
      .setTitle('📊 Konvault Leaderboard')
      .setDescription(lines.join('\n'))
      .addFields(
        {name:'📈 Biggest Winner',value:'<@'+top[0]+'>  +'+(top[1].pnl>=0?'$':'-$')+Math.abs(top[1].pnl).toFixed(2),inline:true},
        {name:'📉 Biggest Loser',value:'<@'+bot[0]+'>  -$'+Math.abs(bot[1].pnl).toFixed(2),inline:true},
      )
      .setThumbnail(IMAGES.logo).setFooter({text:'KONVAULT™  •  Based on logged defeats',iconURL:IMAGES.logo}).setTimestamp()]});
  },
};
