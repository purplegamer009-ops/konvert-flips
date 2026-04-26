const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { wait, hmacRoll, IMAGES, PURPLE } = require('../utils/theme');
const { log } = require('../utils/logger');
const { addRematch } = require('../utils/rematch');
const SUITS=['♠️','♥️','♦️','♣️'],VALS=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const RANKS={'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14};
function drawCard(){return{v:VALS[hmacRoll(0,12)],s:SUITS[hmacRoll(0,3)]};}
function cardStr(c){return '**'+c.v+c.s+'** *('+RANKS[c.v]+')*';}
module.exports = {
  data: new SlashCommandBuilder().setName('cardwar').setDescription('🃏 1v1 Card War — highest card wins, best of 3!')
    .addUserOption(o=>o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),
  async execute(interaction,client){
    const opponent=interaction.options.getUser('opponent');
    if(opponent.id===interaction.user.id)return interaction.reply({content:'🚫 Cannot play yourself.',ephemeral:true});
    if(opponent.bot)return interaction.reply({content:'🚫 Cannot play a bot.',ephemeral:true});
    await interaction.reply({content:'<@'+opponent.id+'>',embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('<@'+interaction.user.id+'> challenged <@'+opponent.id+'> to **Card War**\n🃏 Both draw — highest card wins\n🏆 First to 2 rounds wins\n\n`accept` or `decline`').setThumbnail(IMAGES.highcard).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    let accepted=false;
    try{const col=await interaction.channel.awaitMessages({filter:m=>m.author.id===opponent.id&&['accept','decline'].includes(m.content.toLowerCase().trim()),max:1,time:30000,errors:['time']});accepted=col.first().content.toLowerCase().trim()==='accept';await col.first().delete().catch(()=>{});}
    catch{return interaction.channel.send({content:'⏰ No response.'});}
    if(!accepted)return interaction.channel.send({content:'❌ Declined.'});
    let wins1=0,wins2=0,round=1;
    while(wins1<2&&wins2<2){
      await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('**Round '+round+'** — drawing cards...').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
      await wait(1200);
      let c1=drawCard(),c2=drawCard();
      while(RANKS[c1.v]===RANKS[c2.v]){
        await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('<@'+interaction.user.id+'> '+cardStr(c1)+'\n<@'+opponent.id+'> '+cardStr(c2)+'\n\n⚖️ TIE — redrawing...').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
        await wait(1200);c1=drawCard();c2=drawCard();
      }
      const p1wins=RANKS[c1.v]>RANKS[c2.v];
      if(p1wins)wins1++;else wins2++;
      const rWinner=p1wins?interaction.user:opponent;
      await interaction.channel.send({embeds:[new EmbedBuilder().setColor(p1wins?0x00E676:PURPLE)
        .setDescription('<@'+interaction.user.id+'> '+cardStr(c1)+'\n<@'+opponent.id+'> '+cardStr(c2)+'\n\n🏆 <@'+rWinner.id+'> wins round '+round+'\n📊 Score: **'+wins1+'** — **'+wins2+'**')
        .setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
      round++;if(wins1<2&&wins2<2)await wait(800);
    }
    const matchWinner=wins1>=2?interaction.user:opponent;
    const resultMsg=await interaction.channel.send({embeds:[new EmbedBuilder().setColor(0x00E676)
      .setDescription('🏆 **<@'+matchWinner.id+'> wins the match!**\n\n**'+wins1+'** — **'+wins2+'**')
      .setImage(IMAGES.win).setThumbnail(IMAGES.logo).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    await log(client,{user:matchWinner,game:'1v1 Card War',result:'WIN',detail:matchWinner.username+' won '+Math.max(wins1,wins2)+'-'+Math.min(wins1,wins2)});
    await addRematch(interaction.channel,resultMsg,interaction.user,opponent,'cardwar');
  },
};
