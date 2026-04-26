const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('unlock').setDescription('🔓 Owner: re-enable games in channel')
    .addChannelOption(o=>o.setName('channel').setDescription('Channel (default: current)').setRequired(false)),
  async execute(interaction,client){
    if(interaction.user.id!==process.env.OWNER_ID)return interaction.reply({content:'🚫 Owner only.',ephemeral:true});
    const target=interaction.options.getChannel('channel')??interaction.channel;
    client.blockedChannels.delete(target.id);
    await interaction.reply({content:'🔓 Games re-enabled in <#'+target.id+'>',ephemeral:true});
  },
};
