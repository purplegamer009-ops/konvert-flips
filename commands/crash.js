const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { wait, hmacFloat, hmacFloat2, IMAGES, PURPLE } = require('../utils/theme');
const { log } = require('../utils/logger');
const { addRematch } = require('../utils/rematch');
function crashPoint(){const r=hmacFloat();if(r<0.40)return hmacFloat2(1.0,1.9);if(r<0.65)return hmacFloat2(2,4);if(r<0.82)return hmacFloat2(5,10);if(r<0.93)return hmacFloat2(10,20);if(r<0.98)return hmacFloat2(20,50);return hmacFloat2(50,100);}
module.exports = {
  data: new SlashCommandBuilder().setName('crash').setDescription('📈 1v1 Crash — secret cashouts!')
    .addUserOption(o=>o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),
  async execute(interaction,client){
    const opponent=interaction.options.getUser('opponent');
    if(opponent.id===interaction.user.id)return interaction.reply({content:'🚫 Cannot play yourself.',ephemeral:true});
    if(opponent.bot)return interaction.reply({content:'🚫 Cannot play a bot.',ephemeral:true});
    await interaction.reply({content:'<@'+opponent.id+'>',embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('<@'+interaction.user.id+'> challenged <@'+opponent.id+'> to **Crash**\n📈 Both set secret cashouts via popup\n\n`accept` or `decline`').setThumbnail(IMAGES.crash).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    let accepted=false;
    try{const col=await interaction.channel.awaitMessages({filter:m=>m.author.id===opponent.id&&['accept','decline'].includes(m.content.toLowerCase().trim()),max:1,time:30000,errors:['time']});accepted=col.first().content.toLowerCase().trim()==='accept';await col.first().delete().catch(()=>{});}
    catch{return interaction.channel.send({content:'⏰ No response.'});}
    if(!accepted)return interaction.channel.send({content:'❌ Declined.'});
    await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('✅ Accepted — both click your button to set your cashout secretly.').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    const p1row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('crash_modal_p1').setLabel('📈 Set Cashout').setStyle(ButtonStyle.Primary));
    const p2row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('crash_modal_p2').setLabel('📈 Set Cashout').setStyle(ButtonStyle.Primary));
    const msg1=await interaction.channel.send({content:'<@'+interaction.user.id+'>',components:[p1row]});
    const msg2=await interaction.channel.send({content:'<@'+opponent.id+'>',components:[p2row]});
    async function collectModal(msg,userId,customId){
      return new Promise(resolve=>{
        const timeout=setTimeout(()=>resolve(null),60000);
        const col=msg.createMessageComponentCollector({filter:b=>b.user.id===userId&&b.customId===customId,time:60000,max:1});
        col.on('collect',async btn=>{
          const modal=new ModalBuilder().setCustomId('crash_input_'+userId).setTitle('Set Your Cashout');
          const input=new TextInputBuilder().setCustomId('cashout_value').setLabel('Multiplier (e.g. 2.5)').setStyle(TextInputStyle.Short).setPlaceholder('1.01 – 100').setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          await btn.showModal(modal);
          try{const sub=await btn.awaitModalSubmit({time:60000,filter:i=>i.user.id===userId});const val=parseFloat(sub.fields.getTextInputValue('cashout_value'));if(isNaN(val)||val<1.01||val>100){await sub.reply({content:'❌ Must be 1.01–100.',ephemeral:true});clearTimeout(timeout);return resolve(null);}await sub.reply({content:'✅ **'+val+'x** locked!',ephemeral:true});clearTimeout(timeout);resolve(val);}
          catch{clearTimeout(timeout);resolve(null);}
        });
        col.on('end',(_,r)=>{if(r==='time'){clearTimeout(timeout);resolve(null);}});
      });
    }
    const[c1,c2]=await Promise.all([collectModal(msg1,interaction.user.id,'crash_modal_p1'),collectModal(msg2,opponent.id,'crash_modal_p2')]);
    await msg1.edit({components:[]}).catch(()=>{});await msg2.edit({components:[]}).catch(()=>{});
    if(!c1||!c2)return interaction.channel.send({content:'⏰ Someone timed out.'});
    await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('Both locked in — **???x** vs **???x**\n\n📈 Launching...').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    await wait(2000);
    const cp=crashPoint(),p1s=c1<=cp,p2s=c2<=cp;
    let line,winner;
    if(p1s&&!p2s){winner=interaction.user;line='🏆 **<@'+interaction.user.id+'> wins** — cashed at **'+c1+'x**';}
    else if(!p1s&&p2s){winner=opponent;line='🏆 **<@'+opponent.id+'> wins** — cashed at **'+c2+'x**';}
    else if(p1s&&p2s){const d1=cp-c1,d2=cp-c2;if(d1<d2){winner=interaction.user;line='🏆 **<@'+interaction.user.id+'> wins** — closer (**'+c1+'x** vs **'+c2+'x**)';}else if(d2<d1){winner=opponent;line='🏆 **<@'+opponent.id+'> wins** — closer (**'+c2+'x** vs **'+c1+'x**)';}else{line='🤝 TIE';}}
    else{line='💥 Both busted';}
    const resultMsg=await interaction.channel.send({embeds:[new EmbedBuilder().setColor(winner?0x00E676:PURPLE)
      .setDescription('💥 Crashed at **'+cp+'x**\n\n<@'+interaction.user.id+'> **'+c1+'x** '+(p1s?'✅':'❌')+'\n<@'+opponent.id+'> **'+c2+'x** '+(p2s?'✅':'❌')+'\n\n'+line)
      .setThumbnail(IMAGES.crash).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    await log(client,{user:winner||interaction.user,game:'1v1 Crash',result:winner?'WIN':'TIE',detail:'Crash: '+cp+'x — '+interaction.user.username+': '+c1+'x '+(p1s?'✅':'❌')+' — '+opponent.username+': '+c2+'x '+(p2s?'✅':'❌')});
    await addRematch(interaction.channel,resultMsg,interaction.user,opponent,'crash');
  },
};
