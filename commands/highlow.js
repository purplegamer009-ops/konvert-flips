const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hmacRoll, IMAGES, PURPLE } = require('../utils/theme');
const { log } = require('../utils/logger');
const { addRematch } = require('../utils/rematch');
module.exports = {
  data: new SlashCommandBuilder().setName('highlow').setDescription('🔢 1v1 Higher or Lower')
    .addUserOption(o=>o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),
  async execute(interaction,client){
    const opponent=interaction.options.getUser('opponent');
    if(opponent.id===interaction.user.id)return interaction.reply({content:'🚫 Cannot play yourself.',ephemeral:true});
    if(opponent.bot)return interaction.reply({content:'🚫 Cannot play a bot.',ephemeral:true});
    await interaction.reply({content:'<@'+opponent.id+'>',embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('<@'+interaction.user.id+'> challenged <@'+opponent.id+'> to **Higher or Lower**\n🔢 Guess 1–100 in chat\n\n`accept` or `decline`').setThumbnail(IMAGES.highlow).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    let accepted=false;
    try{const col=await interaction.channel.awaitMessages({filter:m=>m.author.id===opponent.id&&['accept','decline'].includes(m.content.toLowerCase().trim()),max:1,time:30000,errors:['time']});accepted=col.first().content.toLowerCase().trim()==='accept';await col.first().delete().catch(()=>{});}
    catch{return interaction.channel.send({content:'⏰ No response.'});}
    if(!accepted)return interaction.channel.send({content:'❌ Declined.'});
    const secret=hmacRoll(1,100);
    const players=[interaction.user,opponent];
    let idx=0,guesses=0;
    await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('🎮 Secret locked — <@'+players[0].id+'> goes first. Type a number!').setThumbnail(IMAGES.highlow).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    while(true){
      const cur=players[idx%2];guesses++;
      await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('<@'+cur.id+'> — guess (1–100)  ⏳ 30s').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
      let guess=null;
      try{const col=await interaction.channel.awaitMessages({filter:m=>m.author.id===cur.id&&!isNaN(parseInt(m.content.trim()))&&parseInt(m.content.trim())>=1&&parseInt(m.content.trim())<=100,max:1,time:30000,errors:['time']});guess=parseInt(col.first().content.trim());await col.first().delete().catch(()=>{});}
      catch{return interaction.channel.send({content:'⏰ <@'+cur.id+'> timed out.'});}
      if(guess===secret){
        const resultMsg=await interaction.channel.send({embeds:[new EmbedBuilder().setColor(0x00E676).setDescription('<@'+cur.id+'> guessed **'+guess+'** ✅\n\n🏆 **<@'+cur.id+'> wins** — secret was **'+secret+'** • '+guesses+' guesses').setThumbnail(IMAGES.win).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
        await log(client,{user:cur,game:'Higher or Lower',result:'WIN',detail:cur.username+' guessed '+secret+' in '+guesses});
        await addRematch(interaction.channel,resultMsg,interaction.user,opponent,'highlow');
        return;
      }
      const hint=guess<secret?'📈 Higher':'📉 Lower';
      await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('<@'+cur.id+'> guessed **'+guess+'** — '+hint+'\n<@'+players[(idx+1)%2].id+'> — your turn!').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
      idx++;
    }
  },
};
