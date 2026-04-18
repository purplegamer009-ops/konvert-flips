const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');
module.exports = {
  data: new SlashCommandBuilder().setName('endgame').setDescription('🔓  Owner: unlock the game channel'),
  async execute(interaction,client){
    if(interaction.user.id!==process.env.OWNER_ID)return interaction.reply({content:'🚫  Owner only.',ephemeral:true});
    const channel=interaction.channel;
    const guild=interaction.guild;
    await interaction.deferReply();
    try{
      await channel.permissionOverwrites.edit(guild.roles.everyone,{SendMessages:null});
      const toDelete=channel.permissionOverwrites.cache.filter(o=>o.id!==guild.roles.everyone.id&&o.id!==client.user.id);
      for(const[id]of toDelete)await channel.permissionOverwrites.delete(id);
      await interaction.editReply({embeds:[em('Konvault\' Game Channel','🔓  Channel unlocked — everyone can type again.')]});
    }catch(err){console.error(err);await interaction.editReply({content:'❌  Failed.',ephemeral:true});}
  },
};
