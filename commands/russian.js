const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { wait, hmacRoll, secureShuffle, IMAGES, PURPLE } = require('../utils/theme');
const { log } = require('../utils/logger');
const { addRematch } = require('../utils/rematch');
module.exports = {
  data: new SlashCommandBuilder().setName('russian').setDescription('🔫 1v1 Russian Roulette')
    .addUserOption(o=>o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),
  async execute(interaction,client){
    const opponent=interaction.options.getUser('opponent');
    if(opponent.id===interaction.user.id)return interaction.reply({content:'🚫 Cannot play yourself.',ephemeral:true});
    if(opponent.bot)return interaction.reply({content:'🚫 Cannot play a bot.',ephemeral:true});
    await interaction.reply({content:'<@'+opponent.id+'>',embeds:[new EmbedBuilder().setColor(PURPLE)
      .setDescription('<@'+interaction.user.id+'> challenged <@'+opponent.id+'> to **Russian Roulette**\n🔫 1 bullet in 6 chambers\n\n`accept` or `decline`')
      .setThumbnail(IMAGES.russian).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    let accepted=false;
    try{const col=await interaction.channel.awaitMessages({filter:m=>m.author.id===opponent.id&&['accept','decline'].includes(m.content.toLowerCase().trim()),max:1,time:30000,errors:['time']});accepted=col.first().content.toLowerCase().trim()==='accept';await col.first().delete().catch(()=>{});}
    catch{return interaction.channel.send({content:'⏰ No response.'});}
    if(!accepted)return interaction.channel.send({content:'❌ Declined.'});
    const players=secureShuffle([interaction.user,opponent]);
    await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('**Order:** <@'+players[0].id+'> → <@'+players[1].id+'>\n🔫 Loading...').setThumbnail(IMAGES.russian).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    await wait(1500);
    let round=1;
    while(true){
      for(const player of players){
        await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('Round **'+round+'** — <@'+player.id+'> pulls the trigger...').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
        await wait(1500);
        if(hmacRoll(1,6)===1){
          const winner=player.id===players[0].id?players[1]:players[0];
          const resultMsg=await interaction.channel.send({embeds:[new EmbedBuilder().setColor(0x00E676).setDescription('# 💥 BANG\n<@'+player.id+'> got shot\n\n🏆 **<@'+winner.id+'> wins**').setThumbnail(IMAGES.win).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
          await log(client,{user:winner,game:'1v1 Russian Roulette',result:'WIN',detail:winner.username+' survived — '+player.username+' shot round '+round});
          await addRematch(interaction.channel,resultMsg,interaction.user,opponent,'russian');
          return;
        }
        await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('Round **'+round+'** — 🔔 CLICK — empty\n<@'+player.id+'> passes the gun').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
        await wait(800);
      }
      round++;
    }
  },
};
