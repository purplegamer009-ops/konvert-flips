const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('endgame').setDescription('🔓 Owner: unlock game channel'),
  async execute(interaction,client){
    if(interaction.user.id!==process.env.OWNER_ID)return interaction.reply({content:'🚫 Owner only.',ephemeral:true});
    const channel=interaction.channel,guild=interaction.guild;
    await interaction.deferReply();
    try{
      await channel.permissionOverwrites.edit(guild.roles.everyone,{SendMessages:null});
      const toDelete=channel.permissionOverwrites.cache.filter(o=>o.id!==guild.roles.everyone.id&&o.id!==client.user.id);
      for(const[id]of toDelete)await channel.permissionOverwrites.delete(id);
      await interaction.editReply({content:'🔓 Channel unlocked.'});
    }catch(e){await interaction.editReply({content:'❌ Failed.'});}
  },
};
