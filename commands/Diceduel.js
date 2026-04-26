const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { wait, hmacRoll, IMAGES, PURPLE } = require('../utils/theme');
const { log } = require('../utils/logger');
const { addRematch } = require('../utils/rematch');
module.exports = {
  data: new SlashCommandBuilder().setName('diceduel').setDescription('🎲 1v1 Dice Duel — predict over or under 7!')
    .addUserOption(o=>o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),
  async execute(interaction,client){
    const opponent=interaction.options.getUser('opponent');
    if(opponent.id===interaction.user.id)return interaction.reply({content:'🚫 Cannot play yourself.',ephemeral:true});
    if(opponent.bot)return interaction.reply({content:'🚫 Cannot play a bot.',ephemeral:true});
    await interaction.reply({content:'<@'+opponent.id+'>',embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('<@'+interaction.user.id+'> challenged <@'+opponent.id+'> to **Dice Duel**\n🎲 Both secretly pick over or under 7\n⚡ One roll decides both\n\n`accept` or `decline`').setThumbnail(IMAGES.dice).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    let accepted=false;
    try{const col=await interaction.channel.awaitMessages({filter:m=>m.author.id===opponent.id&&['accept','decline'].includes(m.content.toLowerCase().trim()),max:1,time:30000,errors:['time']});accepted=col.first().content.toLowerCase().trim()==='accept';await col.first().delete().catch(()=>{});}
    catch{return interaction.channel.send({content:'⏰ No response.'});}
    if(!accepted)return interaction.channel.send({content:'❌ Declined.'});
    await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('✅ Accepted — both click your button to pick secretly.').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    const p1row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('dd_p1_'+interaction.user.id).setLabel('🎲 Pick Over or Under').setStyle(ButtonStyle.Primary));
    const p2row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('dd_p2_'+opponent.id).setLabel('🎲 Pick Over or Under').setStyle(ButtonStyle.Primary));
    const msg1=await interaction.channel.send({content:'<@'+interaction.user.id+'>',components:[p1row]});
    const msg2=await interaction.channel.send({content:'<@'+opponent.id+'>',components:[p2row]});
    async function collectPick(msg,userId,customId){
      return new Promise(resolve=>{
        const timeout=setTimeout(()=>resolve(null),60000);
        const col=msg.createMessageComponentCollector({filter:b=>b.user.id===userId&&b.customId===customId,time:60000,max:1});
        col.on('collect',async btn=>{
          const modal=new ModalBuilder().setCustomId('dd_modal_'+userId).setTitle('Your Prediction');
          const input=new TextInputBuilder().setCustomId('dd_pick').setLabel('Type "over" or "under"').setStyle(TextInputStyle.Short).setPlaceholder('over / under').setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          await btn.showModal(modal);
          try{const sub=await btn.awaitModalSubmit({time:60000,filter:i=>i.user.id===userId});const val=sub.fields.getTextInputValue('dd_pick').toLowerCase().trim();if(!['over','under'].includes(val)){await sub.reply({content:'❌ Type `over` or `under`',ephemeral:true});clearTimeout(timeout);return resolve(null);}await sub.reply({content:'✅ **'+val.toUpperCase()+'** locked!',ephemeral:true});clearTimeout(timeout);resolve(val);}
          catch{clearTimeout(timeout);resolve(null);}
        });
        col.on('end',(_,r)=>{if(r==='time'){clearTimeout(timeout);resolve(null);}});
      });
    }
    const[pick1,pick2]=await Promise.all([collectPick(msg1,interaction.user.id,'dd_p1_'+interaction.user.id),collectPick(msg2,opponent.id,'dd_p2_'+opponent.id)]);
    await msg1.edit({components:[]}).catch(()=>{});await msg2.edit({components:[]}).catch(()=>{});
    if(!pick1||!pick2)return interaction.channel.send({content:'⏰ Someone timed out.'});
    await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('Both locked in — rolling the dice...').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    await wait(1500);
    const d1=hmacRoll(1,6),d2=hmacRoll(1,6),total=d1+d2;
    const result=total>7?'over':total<7?'under':'seven';
    const p1correct=pick1===result,p2correct=pick2===result;
    let line,winner;
    if(result==='seven'){line='⚖️ **Exactly 7 — everyone loses!**';}
    else if(p1correct&&!p2correct){winner=interaction.user;line='🏆 **<@'+interaction.user.id+'> wins** — called **'+pick1.toUpperCase()+'** correctly!';}
    else if(!p1correct&&p2correct){winner=opponent;line='🏆 **<@'+opponent.id+'> wins** — called **'+pick2.toUpperCase()+'** correctly!';}
    else if(p1correct&&p2correct){line='🤝 TIE — both called it!';}
    else{line='💀 Both wrong — nobody wins!';}
    const resultMsg=await interaction.channel.send({embeds:[new EmbedBuilder().setColor(winner?0x00E676:PURPLE)
      .setDescription('🎲 Rolled **'+d1+' + '+d2+' = '+total+'** — '+(total>7?'📈 OVER':total<7?'📉 UNDER':'⚖️ SEVEN')+'\n\n<@'+interaction.user.id+'> **'+pick1.toUpperCase()+'** '+(p1correct?'✅':'❌')+'\n<@'+opponent.id+'> **'+pick2.toUpperCase()+'** '+(p2correct?'✅':'❌')+'\n\n'+line)
      .setThumbnail(IMAGES.dice).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    await log(client,{user:winner||interaction.user,game:'1v1 Dice Duel',result:winner?'WIN':'TIE',detail:'Roll: '+total+' — '+interaction.user.username+': '+pick1+' vs '+opponent.username+': '+pick2});
    await addRematch(interaction.channel,resultMsg,interaction.user,opponent,'diceduel');
  },
};
