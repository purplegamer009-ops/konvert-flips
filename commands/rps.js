const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateFairRoll, IMAGES, PURPLE } = require('../utils/theme');
const { log } = require('../utils/logger');
const { storeProof, verifyFooter } = require('../utils/verifyButton');
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
      .setDescription('<@'+interaction.user.id+'> challenged <@'+opponent.id+'> to **RPS**\n📩 Check DMs — type your move\n\n`accept` or `decline`')
      .setThumbnail(IMAGES.rps).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    let accepted=false;
    try{const col=await interaction.channel.awaitMessages({filter:m=>m.author.id===opponent.id&&['accept','decline'].includes(m.content.toLowerCase().trim()),max:1,time:30000,errors:['time']});accepted=col.first().content.toLowerCase().trim()==='accept';await col.first().delete().catch(()=>{});}
    catch{return interaction.channel.send({content:'⏰ No response.'});}
    if(!accepted)return interaction.channel.send({content:'❌ Declined.'});
    async function getPick(user){
      try{const dm=await user.createDM();await dm.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('Type: `rock` `paper` `scissors`').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});}catch{return null;}
      return new Promise(resolve=>{
        const timeout=setTimeout(()=>{client.off('messageCreate',handler);resolve(null);},60000);
        function handler(msg){if(msg.author.id!==user.id||msg.guild)return;if(!['rock','paper','scissors'].includes(msg.content.toLowerCase().trim()))return;clearTimeout(timeout);client.off('messageCreate',handler);msg.author.createDM().then(dm=>dm.send('✅ Locked in!')).catch(()=>{});resolve(msg.content.toLowerCase().trim());}
        client.on('messageCreate',handler);
      });
    }
    const[p1,p2]=await Promise.all([getPick(interaction.user),getPick(opponent)]);
    if(!p1||!p2)return interaction.channel.send({content:'⏰ Someone timed out.'});
    const fair=generateFairRoll(1,2);
    let line,winner;
    if(p1===p2){line='🤝 TIE — both '+E[p1];}
    else if(BEATS[p1]===p2){winner=interaction.user;line='🏆 **<@'+interaction.user.id+'> wins**  '+E[p1]+' > '+E[p2];}
    else{winner=opponent;line='🏆 **<@'+opponent.id+'> wins**  '+E[p2]+' > '+E[p1];}
    const proofId=storeProof(interaction.channelId,{id:Date.now()+'_rps',game:'RPS',result:p1+' vs '+p2,userId:interaction.user.id,serverSeed:fair.serverSeed,clientSeed:fair.clientSeed,nonce:fair.nonce});
    const resultMsg=await interaction.channel.send({embeds:[new EmbedBuilder().setColor(winner?0x00E676:PURPLE)
      .setDescription('<@'+interaction.user.id+'> '+E[p1]+' **'+p1+'**\n<@'+opponent.id+'> '+E[p2]+' **'+p2+'**\n\n'+line+verifyFooter(proofId))
      .setThumbnail(IMAGES.rps).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    await log(client,{user:winner||interaction.user,game:'1v1 RPS',result:winner?'WIN':'TIE',detail:interaction.user.username+': '+p1+' vs '+opponent.username+': '+p2});
    await addRematch(interaction.channel,resultMsg,interaction.user,opponent,'rps');
  },
};
