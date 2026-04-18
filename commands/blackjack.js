const { SlashCommandBuilder } = require('discord.js');
const { em, wait, hmacRoll } = require('../utils/theme');
const { log } = require('../utils/logger');
const SUITS=['♠️','♥️','♦️','♣️'];
const VALS=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const card=()=>({s:SUITS[hmacRoll(0,3)],v:VALS[hmacRoll(0,12)]});
const cval=v=>['J','Q','K'].includes(v)?10:v==='A'?11:parseInt(v);
const show=h=>h.map(c=>`${c.v}${c.s}`).join(' ');
function total(h){let t=h.reduce((s,c)=>s+cval(c.v),0),a=h.filter(c=>c.v==='A').length;while(t>21&&a--)t-=10;return t;}
async function playHandDM(client,user,channel){
  let hand=[card(),card()];
  let dm;
  try{dm=await user.createDM();}catch{await channel.send({embeds:[em('Konvault\' Blackjack','❌  Could not DM <@'+user.id+'>. Make sure DMs are open.')]});return{total:0,bust:true,failed:true};}
  if(total(hand)===21){await dm.send({embeds:[em('Konvault\' Blackjack','🃏  **'+show(hand)+'**\n\n🎉  BLACKJACK!')]});await channel.send({embeds:[em('Konvault\' Blackjack','<@'+user.id+'> got their cards ✅')]});return{total:21,blackjack:true};}
  await dm.send({embeds:[em('Konvault\' Blackjack','Your hand:\n🃏  **'+show(hand)+'**  =  **'+total(hand)+'**\n\nType `hit` or `stand`')]});
  await channel.send({embeds:[em('Konvault\' Blackjack','<@'+user.id+'> is playing in DMs — check your DMs!')]});
  while(true){
    let move=null;
    await new Promise(resolve=>{
      const timeout=setTimeout(()=>{client.off('messageCreate',handler);resolve();},60000);
      function handler(msg){if(msg.author.id!==user.id)return;if(msg.guild)return;const content=msg.content.toLowerCase().trim();if(!['hit','stand'].includes(content))return;clearTimeout(timeout);client.off('messageCreate',handler);move=content;resolve();}
      client.on('messageCreate',handler);
    });
    if(!move){await dm.send({embeds:[em('Konvault\' Blackjack','⏰  Timed out — standing on **'+total(hand)+'**')]});return{total:total(hand)};}
    if(move==='stand'){await dm.send({embeds:[em('Konvault\' Blackjack','✋  Standing on **'+total(hand)+'**')]});return{total:total(hand)};}
    hand.push(card());const t=total(hand);
    if(t>21){await dm.send({embeds:[em('Konvault\' Blackjack','🃏  **'+show(hand)+'**  =  **'+t+'**\n\n💥  BUST!')]});return{total:t,bust:true};}
    if(t===21){await dm.send({embeds:[em('Konvault\' Blackjack','🃏  **'+show(hand)+'**  =  **21**\n\n✅  Standing on 21')]});return{total:21};}
    await dm.send({embeds:[em('Konvault\' Blackjack','Your hand:\n🃏  **'+show(hand)+'**  =  **'+t+'**\n\nType `hit` or `stand`')]});
  }
}
module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('🃏  1v1 Blackjack — played in DMs!')
    .addUserOption(o=>o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),
  async execute(interaction,client){
    const opponent=interaction.options.getUser('opponent');
    if(opponent.id===interaction.user.id)return interaction.reply({content:'🚫  You cannot play yourself.',ephemeral:true});
    if(opponent.bot)return interaction.reply({content:'🚫  Cannot play against a bot.',ephemeral:true});
    await interaction.reply({embeds:[em('Konvault\' Blackjack','<@'+interaction.user.id+'> challenged <@'+opponent.id+'> to **1v1 Blackjack!**\n\n<@'+opponent.id+'> — type `accept` or `decline` in chat')]});
    let accepted=false;
    try{const col=await interaction.channel.awaitMessages({filter:m=>m.author.id===opponent.id&&['accept','decline'].includes(m.content.toLowerCase().trim()),max:1,time:30000,errors:['time']});accepted=col.first().content.toLowerCase().trim()==='accept';await col.first().delete().catch(()=>{});}
    catch{return interaction.channel.send({embeds:[em('Konvault\' Blackjack','⏰  No response. Cancelled.')]});}
    if(!accepted)return interaction.channel.send({embeds:[em('Konvault\' Blackjack','❌  <@'+opponent.id+'> declined.')]});
    await interaction.channel.send({embeds:[em('Konvault\' Blackjack','🃏  Game on! Both players play in DMs\n\n<@'+interaction.user.id+'> goes first — check your DMs!')]});
    await wait(500);
    const r1=await playHandDM(client,interaction.user,interaction.channel);
    if(r1.failed)return;
    await wait(500);
    await interaction.channel.send({embeds:[em('Konvault\' Blackjack','<@'+interaction.user.id+'> is done!\n\nNow <@'+opponent.id+'> — check your DMs!')]});
    const r2=await playHandDM(client,opponent,interaction.channel);
    if(r2.failed)return;
    await wait(500);
    const t1=r1.bust?-1:r1.total,t2=r2.bust?-1:r2.total;
    let line,winner;
    if(t1===t2||(r1.bust&&r2.bust)){line='🤝  TIE';}
    else if(t1>t2){winner=interaction.user;line='🏆  **<@'+interaction.user.id+'> wins!**';}
    else{winner=opponent;line='🏆  **<@'+opponent.id+'> wins!**';}
    await interaction.channel.send({embeds:[em('Konvault\' Blackjack — Result','<@'+interaction.user.id+'>  **'+(r1.bust?'BUST':r1.total)+'**\n<@'+opponent.id+'>  **'+(r2.bust?'BUST':r2.total)+'**\n\n'+line)]});
    await log(client,{user:winner??interaction.user,game:'1v1 Blackjack',result:winner?'WIN':'TIE',detail:interaction.user.username+': '+(r1.bust?'BUST':r1.total)+'  vs  '+opponent.username+': '+(r2.bust?'BUST':r2.total)});
  },
};
