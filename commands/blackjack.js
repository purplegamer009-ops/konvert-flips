const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { wait, hmacRoll, IMAGES, PURPLE } = require('../utils/theme');
const { log } = require('../utils/logger');
const { addRematch } = require('../utils/rematch');
const SUITS=['♠️','♥️','♦️','♣️'],VALS=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const card=()=>({s:SUITS[hmacRoll(0,3)],v:VALS[hmacRoll(0,12)]});
const cval=v=>['J','Q','K'].includes(v)?10:v==='A'?11:parseInt(v);
const show=h=>h.map(c=>c.v+c.s).join(' ');
function total(h){let t=h.reduce((s,c)=>s+cval(c.v),0),a=h.filter(c=>c.v==='A').length;while(t>21&&a--)t-=10;return t;}
async function playHandDM(client,user,channel){
  let hand=[card(),card()],dm;
  try{dm=await user.createDM();}catch{await channel.send({content:'❌ Could not DM <@'+user.id+'> — enable DMs.'});return{total:0,bust:true,failed:true};}
  if(total(hand)===21){
    await dm.send({embeds:[new EmbedBuilder().setColor(0xFFD700).setTitle('🃏 Blackjack!').setDescription('Your hand: **'+show(hand)+'**\n\n🎉 BLACKJACK!').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    await channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('<@'+user.id+'> got their cards ✅').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    return{total:21,blackjack:true};
  }
  await dm.send({embeds:[new EmbedBuilder().setColor(PURPLE).setTitle('🃏 Blackjack — Your Turn').setDescription('Your hand:\n**'+show(hand)+'** = **'+total(hand)+'**\n\nType `hit` or `stand`').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
  await channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('<@'+user.id+'> is playing in DMs — check your DMs!').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
  while(true){
    let move=null;
    await new Promise(resolve=>{
      const timeout=setTimeout(()=>{client.off('messageCreate',handler);resolve();},60000);
      function handler(msg){if(msg.author.id!==user.id||msg.guild)return;const c=msg.content.toLowerCase().trim();if(!['hit','stand'].includes(c))return;clearTimeout(timeout);client.off('messageCreate',handler);move=c;resolve();}
      client.on('messageCreate',handler);
    });
    if(!move){await dm.send({content:'⏰ Timed out — standing on **'+total(hand)+'**'});return{total:total(hand)};}
    if(move==='stand'){await dm.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('✋ Standing on **'+total(hand)+'**').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});return{total:total(hand)};}
    hand.push(card());const t=total(hand);
    if(t>21){await dm.send({embeds:[new EmbedBuilder().setColor(0xFF1744).setTitle('💥 Bust!').setDescription('Hand: **'+show(hand)+'** = **'+t+'**').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});return{total:t,bust:true};}
    if(t===21){await dm.send({embeds:[new EmbedBuilder().setColor(0x00E676).setDescription('Hand: **'+show(hand)+'** = **21** ✅ Standing').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});return{total:21};}
    await dm.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('Hand: **'+show(hand)+'** = **'+t+'**\n\nType `hit` or `stand`').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
  }
}
module.exports = {
  data: new SlashCommandBuilder().setName('blackjack').setDescription('🃏 1v1 Blackjack in DMs')
    .addUserOption(o=>o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),
  async execute(interaction,client){
    const opponent=interaction.options.getUser('opponent');
    if(opponent.id===interaction.user.id)return interaction.reply({content:'🚫 Cannot play yourself.',ephemeral:true});
    if(opponent.bot)return interaction.reply({content:'🚫 Cannot play a bot.',ephemeral:true});
    await interaction.reply({content:'<@'+opponent.id+'>',embeds:[new EmbedBuilder().setColor(PURPLE)
      .setTitle('🃏  Blackjack')
      .setThumbnail(IMAGES.blackjack)
      .setDescription('<@'+interaction.user.id+'> challenged <@'+opponent.id+'>\n\nBoth players play in DMs — closest to 21 without busting wins')
      .addFields({name:'Status',value:'Waiting for `accept` or `decline`...'})
      .setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    let accepted=false;
    try{const col=await interaction.channel.awaitMessages({filter:m=>m.author.id===opponent.id&&['accept','decline'].includes(m.content.toLowerCase().trim()),max:1,time:30000,errors:['time']});accepted=col.first().content.toLowerCase().trim()==='accept';await col.first().delete().catch(()=>{});}
    catch{return interaction.channel.send({content:'⏰ No response.'});}
    if(!accepted)return interaction.channel.send({content:'❌ Declined.'});
    await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('🃏 Game on — <@'+interaction.user.id+'> goes first. Check your DMs!').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    await wait(500);
    const r1=await playHandDM(client,interaction.user,interaction.channel);
    if(r1.failed)return;
    await wait(500);
    await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('<@'+interaction.user.id+'> done!\n\nNow <@'+opponent.id+'> — check your DMs!').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    const r2=await playHandDM(client,opponent,interaction.channel);
    if(r2.failed)return;
    await wait(500);
    const t1=r1.bust?-1:r1.total,t2=r2.bust?-1:r2.total;
    let winner;
    if(t1===t2||(r1.bust&&r2.bust)){winner=null;}
    else if(t1>t2){winner=interaction.user;}
    else{winner=opponent;}
    const resultMsg=await interaction.channel.send({embeds:[new EmbedBuilder().setColor(winner?0x00E676:PURPLE)
      .setTitle('🃏  Blackjack — Result')
      .setThumbnail(winner?IMAGES.win:IMAGES.blackjack)
      .addFields(
        {name:'<@'+interaction.user.id+'>',value:(r1.bust?'💥 BUST':'**'+r1.total+'**'),inline:true},
        {name:'<@'+opponent.id+'>',value:(r2.bust?'💥 BUST':'**'+r2.total+'**'),inline:true},
        {name:'Winner',value:winner?'🏆 <@'+winner.id+'>':'🤝 TIE',inline:false},
      )
      .setFooter({text:'KONVAULT™',iconURL:IMAGES.logo}).setTimestamp()]});
    await log(client,{user:winner||interaction.user,game:'1v1 Blackjack',result:winner?'WIN':'TIE',detail:interaction.user.username+': '+(r1.bust?'BUST':r1.total)+' vs '+opponent.username+': '+(r2.bust?'BUST':r2.total)});
    await addRematch(interaction.channel,resultMsg,interaction.user,opponent,'blackjack');
  },
};
