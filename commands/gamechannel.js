const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');
module.exports = {
  data: new SlashCommandBuilder().setName('gamechannel').setDescription('🎮  Owner: lock channel to 2 players only')
    .addUserOption(o=>o.setName('player1').setDescription('First player').setRequired(true))
    .addUserOption(o=>o.setName('player2').setDescription('Second player').setRequired(true)),
  async execute(interaction,client){
    if(interaction.user.id!==process.env.OWNER_ID)return interaction.reply({content:'🚫  Owner only.',ephemeral:true});
    const p1=interaction.options.getUser('player1');
    const p2=interaction.options.getUser('player2');
    const channel=interaction.channel;
    const guild=interaction.guild;
    await interaction.deferReply();
    try{
      await channel.permissionOverwrites.edit(guild.roles.everyone,{SendMessages:false});
      await channel.permissionOverwrites.edit(p1.id,{SendMessages:true,ViewChannel:true});
      await channel.permissionOverwrites.edit(p2.id,{SendMessages:true,ViewChannel:true});
      await channel.permissionOverwrites.edit(interaction.user.id,{SendMessages:true,ViewChannel:true});
      await channel.permissionOverwrites.edit(client.user.id,{SendMessages:true,ViewChannel:true,EmbedLinks:true});
      await interaction.editReply({embeds:[em('Konvault\' Game Channel','🎮  Channel locked to 2 players\n\n👤  <@'+p1.id+'>\n👤  <@'+p2.id+'>\n\nEveryone else can watch.\nUse `/endgame` to unlock.')]});
    }catch(err){console.error(err);await interaction.editReply({content:'❌  Failed. Make sure bot has Manage Channel permission.',ephemeral:true});}
  },
};
