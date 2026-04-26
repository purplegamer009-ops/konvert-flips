const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateFairRoll, IMAGES, PURPLE } = require('../utils/theme');
const { log } = require('../utils/logger');
const { storeProof, verifyRow } = require('../utils/verifyButton');
const { addRematch } = require('../utils/rematch');
const BEATS={rock:'scissors',paper:'rock',scissors:'paper'};
const E={rock:'🪨',paper:'📄',scissors:'✂️'};
module.exports = {
  data: new SlashCommandBuilder().setName('rps').setDescription('✂️ 1v1 Rock Paper Scissors')
    .addUserOption(o=>o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),
  async execute(interaction,client){
    const opponent=interaction.options.getUser('opponent');
    if(opponent.id===interaction.user.id)return interaction.reply({content:'🚫 Cannot play yourself.',ephemeral:true});
    if(opponent.bot)return interaction.reply({content:'🚫 Cannot play a bot.',ephemeral:true});
    await interaction.reply({content:'<@'+opponent.id+'>',embeds:[new EmbedBuilder().setColor(PURPLE)
      .setTitle('✂️  Rock Paper Scissors')
      .setThumbnail(IMAGES.rps)
      .setDescription('<@'+interaction.user.id+'> challenged <@'+opponent.id+'>\n\n📩 Check your DMs and type your move secretly')
      .addFields({name:'Status',value:'Waiting for `accept` or `decline`...',inline:false})
      .setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    let accepted=false;
    try{const col=await interaction.channel.awaitMessages({filter:m=>m.author.id===opponent.id&&['accept','decline'].includes(m.content.toLowerCase().trim()),max:1,time:30000,errors:['time']});accepted=col.first().content.toLowerCase().trim()==='accept';await col.first().delete().catch(()=>{});}
    catch{return interaction.channel.send({content:'⏰ No response — game cancelled.'});}
    if(!accepted)return interaction.channel.send({content:'❌ <@'+opponent.id+'> declined.'});
    async function getPick(user){
      try{const dm=await user.createDM();await dm.send({embeds:[new EmbedBuilder().setColor(PURPLE).setTitle('✂️  RPS — Your Move').setDescription('Type your move below:\n\n`rock`  `paper`  `scissors`\n\nYou have 60 seconds.').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});}catch{return null;}
      return new Promise(resolve=>{
        const timeout=setTimeout(()=>{client.off('messageCreate',handler);resolve(null);},60000);
        function handler(msg){if(msg.author.id!==user.id||msg.guild)return;if(!['rock','paper','scissors'].includes(msg.content.toLowerCase().trim()))return;clearTimeout(timeout);client.off('messageCreate',handler);msg.author.createDM().then(dm=>dm.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('✅ **'+msg.content.toLowerCase().trim()+'** locked in! Waiting for opponent...').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]})).catch(()=>{});resolve(msg.content.toLowerCase().trim());}
        client.on('messageCreate',handler);
      });
    }
    const[p1,p2]=await Promise.all([getPick(interaction.user),getPick(opponent)]);
    if(!p1||!p2)return interaction.channel.send({content:'⏰ Someone timed out — game cancelled.'});
    const fair=generateFairRoll(1,2);
    let line,winner,color=PURPLE;
    if(p1===p2){line='🤝 **TIE** — both picked '+E[p1];}
    else if(BEATS[p1]===p2){winner=interaction.user;line='🏆 **<@'+interaction.user.id+'> wins!**\n'+E[p1]+' beats '+E[p2];color=0x00E676;}
    else{winner=opponent;line='🏆 **<@'+opponent.id+'> wins!**\n'+E[p2]+' beats '+E[p1];color=0x00E676;}
    const proofId=storeProof(interaction.channelId,{id:Date.now()+'_rps',game:'RPS',result:p1+' vs '+p2,userId:interaction.user.id,serverSeed:fair.serverSeed,clientSeed:fair.clientSeed,nonce:fair.nonce});
    const resultMsg=await interaction.channel.send({
      embeds:[new EmbedBuilder().setColor(color)
        .setTitle('✂️  RPS — Result')
        .setThumbnail(winner?IMAGES.win:IMAGES.rps)
        .addFields(
          {name:'<@'+interaction.user.id+'>',value:E[p1]+' **'+p1.toUpperCase()+'**',inline:true},
          {name:'<@'+opponent.id+'>',value:E[p2]+' **'+p2.toUpperCase()+'**',inline:true},
          {name:'Result',value:line,inline:false},
        )
        .setFooter({text:'KONVAULT™',iconURL:IMAGES.logo}).setTimestamp()],
      components:[verifyRow(proofId)],
    });
    await log(client,{user:winner||interaction.user,game:'1v1 RPS',result:winner?'WIN':'TIE',detail:interaction.user.username+': '+p1+' vs '+opponent.username+': '+p2});
    await addRematch(interaction.channel,resultMsg,interaction.user,opponent,'rps');
  },
};
