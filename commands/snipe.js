const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { wait, generateFairRoll, IMAGES, PURPLE } = require('../utils/theme');
const { log } = require('../utils/logger');
const { addRematch } = require('../utils/rematch');
module.exports = {
  data: new SlashCommandBuilder().setName('snipe').setDescription('🎯 1v1 Snipe — closest to target without going over wins!')
    .addUserOption(o=>o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),
  async execute(interaction,client){
    const opponent=interaction.options.getUser('opponent');
    if(opponent.id===interaction.user.id)return interaction.reply({content:'🚫 Cannot play yourself.',ephemeral:true});
    if(opponent.bot)return interaction.reply({content:'🚫 Cannot play a bot.',ephemeral:true});
    await interaction.reply({content:'<@'+opponent.id+'>',embeds:[new EmbedBuilder().setColor(PURPLE)
      .setTitle('🎯  Snipe')
      .setThumbnail(IMAGES.verify)
      .setDescription('<@'+interaction.user.id+'> challenged <@'+opponent.id+'>\n\nBoth secretly pick a number 1–100\nClosest to the random target without going over wins')
      .addFields({name:'Status',value:'Waiting for `accept` or `decline`...'})
      .setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    let accepted=false;
    try{const col=await interaction.channel.awaitMessages({filter:m=>m.author.id===opponent.id&&['accept','decline'].includes(m.content.toLowerCase().trim()),max:1,time:30000,errors:['time']});accepted=col.first().content.toLowerCase().trim()==='accept';await col.first().delete().catch(()=>{});}
    catch{return interaction.channel.send({content:'⏰ No response.'});}
    if(!accepted)return interaction.channel.send({content:'❌ Declined.'});
    await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('✅ Accepted — both click your button to pick secretly.').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    const p1row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('snipe_p1').setLabel('🎯 Enter Number').setStyle(ButtonStyle.Primary));
    const p2row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('snipe_p2').setLabel('🎯 Enter Number').setStyle(ButtonStyle.Primary));
    const msg1=await interaction.channel.send({content:'<@'+interaction.user.id+'>',components:[p1row]});
    const msg2=await interaction.channel.send({content:'<@'+opponent.id+'>',components:[p2row]});
    async function collectPick(msg,userId,customId){
      return new Promise(resolve=>{
        const timeout=setTimeout(()=>resolve(null),60000);
        const col=msg.createMessageComponentCollector({filter:b=>b.user.id===userId&&b.customId===customId,time:60000,max:1});
        col.on('collect',async btn=>{
          const modal=new ModalBuilder().setCustomId('snipe_input_'+userId).setTitle('Your Number');
          const input=new TextInputBuilder().setCustomId('snipe_value').setLabel('Pick 1–100').setStyle(TextInputStyle.Short).setPlaceholder('e.g. 73').setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          await btn.showModal(modal);
          try{const sub=await btn.awaitModalSubmit({time:60000,filter:i=>i.user.id===userId});const val=parseInt(sub.fields.getTextInputValue('snipe_value'));if(isNaN(val)||val<1||val>100){await sub.reply({content:'❌ Must be 1–100.',ephemeral:true});clearTimeout(timeout);return resolve(null);}await sub.reply({content:'✅ **'+val+'** locked!',ephemeral:true});clearTimeout(timeout);resolve(val);}
          catch{clearTimeout(timeout);resolve(null);}
        });
        col.on('end',(_,r)=>{if(r==='time'){clearTimeout(timeout);resolve(null);}});
      });
    }
    const[pick1,pick2]=await Promise.all([collectPick(msg1,interaction.user.id,'snipe_p1'),collectPick(msg2,opponent.id,'snipe_p2')]);
    await msg1.edit({components:[]}).catch(()=>{});await msg2.edit({components:[]}).catch(()=>{});
    if(!pick1||!pick2)return interaction.channel.send({content:'⏰ Someone timed out.'});
    await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('Both locked — 🎯 generating target...').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    await wait(1500);
    const fairRoll=generateFairRoll(1,100);const target=fairRoll.result;
    const diff1=target-pick1,diff2=target-pick2,over1=pick1>target,over2=pick2>target;
    let winner=null;
    if(!over1&&!over2){if(diff1<diff2)winner=interaction.user;else if(diff2<diff1)winner=opponent;}
    else if(over1&&!over2)winner=opponent;
    else if(over2&&!over1)winner=interaction.user;
    else{const a1=Math.abs(pick1-target),a2=Math.abs(pick2-target);if(a1<a2)winner=interaction.user;else if(a2<a1)winner=opponent;}
    const resultMsg=await interaction.channel.send({embeds:[new EmbedBuilder().setColor(winner?0x00E676:PURPLE)
      .setTitle('🎯  Snipe — Result')
      .setThumbnail(winner?IMAGES.win:IMAGES.verify)
      .addFields(
        {name:'Target',value:'**'+target+'**',inline:false},
        {name:'<@'+interaction.user.id+'>',value:'**'+pick1+'** '+(over1?'❌ Over':'✅'),inline:true},
        {name:'<@'+opponent.id+'>',value:'**'+pick2+'** '+(over2?'❌ Over':'✅'),inline:true},
        {name:'Winner',value:winner?'🏆 <@'+winner.id+'>':'🤝 TIE',inline:false},
      )
      .setFooter({text:'KONVAULT™',iconURL:IMAGES.logo}).setTimestamp()]});
    await log(client,{user:winner||interaction.user,game:'1v1 Snipe',result:winner?'WIN':'TIE',detail:'Target: '+target+' — '+interaction.user.username+': '+pick1+' vs '+opponent.username+': '+pick2});
    await addRematch(interaction.channel,resultMsg,interaction.user,opponent,'snipe');
  },
};
