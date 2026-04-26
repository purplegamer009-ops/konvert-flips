const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { wait, hmacRoll, secureShuffle, IMAGES, PURPLE } = require('../utils/theme');
const { log } = require('../utils/logger');
const FLOORS=5;
function makeGrid(){return Array.from({length:FLOORS},()=>hmacRoll(0,2));}
function buildDisplay(picks,currentFloor,dead,grid){
  const lines=[];
  for(let f=FLOORS-1;f>=0;f--){
    const picked=picks[f];const isActive=f===currentFloor&&!dead;let row='';
    for(let c=0;c<3;c++){
      if(picked===undefined){row+=isActive?'🟪 ':'⬛ ';}
      else{if(c===picked&&c===grid[f])row+='💥 ';else if(c===picked)row+='💎 ';else if(c===grid[f]&&(dead||f<currentFloor))row+='💣 ';else row+='⬛ ';}
    }
    const label=isActive?'**Floor '+(f+1)+'** ▶':(picked!==undefined?(picked===grid[f]?'💀 Floor '+(f+1):'✅ Floor '+(f+1)):'Floor '+(f+1));
    lines.push(label+'\n'+row.trim());
  }
  return lines.join('\n\n');
}
function towerEmbed(title,desc,imgKey){return new EmbedBuilder().setColor(PURPLE).setTitle(title).setDescription(desc).setThumbnail(IMAGES.logo).setImage(IMAGES[imgKey]||IMAGES.tower).setTimestamp().setFooter({text:'KONVAULT™',iconURL:IMAGES.logo});}
function floorButtons(userId,floor){return new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('tw_'+userId+'_'+floor+'_0').setLabel('Tile 1').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId('tw_'+userId+'_'+floor+'_1').setLabel('Tile 2').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId('tw_'+userId+'_'+floor+'_2').setLabel('Tile 3').setStyle(ButtonStyle.Primary)
);}
async function runTower(channel,user){
  const grid=makeGrid();const picks={};let floor=0;
  const msg=await channel.send({embeds:[towerEmbed('🗼 '+user.displayName+'\'s Tower',buildDisplay(picks,floor,false,grid)+'\n\n**Pick a tile to start climbing!**','tower')],components:[floorButtons(user.id,floor)]});
  while(floor<FLOORS){
    const choice=await new Promise(function(resolve){
      const timeout=setTimeout(function(){resolve(null);},45000);
      const collector=msg.createMessageComponentCollector({filter:function(b){return b.user.id===user.id&&b.customId.startsWith('tw_'+user.id+'_'+floor+'_');},time:45000,max:1});
      collector.on('collect',async function(btn){await btn.deferUpdate();clearTimeout(timeout);resolve(parseInt(btn.customId.split('_').pop()));});
      collector.on('end',function(_,reason){if(reason==='time'){clearTimeout(timeout);resolve(null);}});
    });
    if(choice===null){await msg.edit({embeds:[towerEmbed('🗼 '+user.displayName+'\'s Tower',buildDisplay(picks,floor,true,grid)+'\n\n⏰ Timed out — reached floor **'+floor+'** / '+FLOORS,'loss')],components:[]});return{floor};}
    picks[floor]=choice;const isBomb=choice===grid[floor];
    await msg.edit({embeds:[towerEmbed('🗼 '+user.displayName+'\'s Tower',buildDisplay(picks,floor,false,grid)+'\n\n⏳ Revealing...','tower')],components:[]});
    await wait(1200);
    if(isBomb){await msg.edit({embeds:[towerEmbed('💥 '+user.displayName+' hit a bomb!',buildDisplay(picks,floor,true,grid)+'\n\n💀 Eliminated on floor **'+(floor+1)+'**\nReached floor **'+floor+'** / '+FLOORS,'loss')],components:[]});return{floor};}
    floor++;
    if(floor>=FLOORS){await msg.edit({embeds:[towerEmbed('🏆 '+user.displayName+' conquered the tower!',buildDisplay(picks,floor-1,false,grid)+'\n\n🎉 **ALL '+FLOORS+' FLOORS CLEARED!**','win')],components:[]});return{floor:FLOORS};}
    await msg.edit({embeds:[towerEmbed('🗼 '+user.displayName+'\'s Tower',buildDisplay(picks,floor,false,grid)+'\n\n✅ Safe! Floor **'+(floor+1)+'** / '+FLOORS+' — keep climbing!','tower')],components:[floorButtons(user.id,floor)]});
  }
  return{floor:FLOORS};
}
module.exports = {
  data: new SlashCommandBuilder().setName('tower').setDescription('🗼 1v1 Tower Climb')
    .addUserOption(function(o){return o.setName('opponent').setDescription('Who to challenge?').setRequired(true);}),
  async execute(interaction,client){
    const opponent=interaction.options.getUser('opponent');
    if(opponent.id===interaction.user.id)return interaction.reply({content:'🚫 Cannot play yourself.',ephemeral:true});
    if(opponent.bot)return interaction.reply({content:'🚫 Cannot play a bot.',ephemeral:true});
    await interaction.reply({content:'<@'+opponent.id+'>',embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('<@'+interaction.user.id+'> challenged <@'+opponent.id+'> to **Tower Climb**\n🗼 '+FLOORS+' floors — pick safe tiles\n💣 Hit a bomb and you fall\n🏆 Highest floor wins\n\n`accept` or `decline`').setThumbnail(IMAGES.tower).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    let accepted=false;
    try{const col=await interaction.channel.awaitMessages({filter:function(m){return m.author.id===opponent.id&&['accept','decline'].includes(m.content.toLowerCase().trim());},max:1,time:30000,errors:['time']});accepted=col.first().content.toLowerCase().trim()==='accept';await col.first().delete().catch(function(){});}
    catch(e){return interaction.channel.send({content:'⏰ No response.'});}
    if(!accepted)return interaction.channel.send({content:'❌ Declined.'});
    const players=secureShuffle([interaction.user,opponent]);
    await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('🗼 Game on!\n\n**'+players[0].displayName+'** goes first\n💎 safe  💣 bomb  💥 eliminated').setThumbnail(IMAGES.tower).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    await wait(800);
    await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('<@'+players[0].id+'> — start climbing! 👇').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    const r1=await runTower(interaction.channel,players[0]);
    await wait(1200);
    await interaction.channel.send({embeds:[new EmbedBuilder().setColor(PURPLE).setDescription('<@'+players[0].id+'> finished at floor **'+r1.floor+'** / '+FLOORS+'\n\n<@'+players[1].id+'> — beat **'+r1.floor+'**! 👇').setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    await wait(500);
    const r2=await runTower(interaction.channel,players[1]);
    await wait(800);
    let line,winner;
    if(r1.floor>r2.floor){winner=players[0];line='🏆 **<@'+players[0].id+'> wins**';}
    else if(r2.floor>r1.floor){winner=players[1];line='🏆 **<@'+players[1].id+'> wins**';}
    else{line='🤝 **TIE** — both floor **'+r1.floor+'**';}
    const resultMsg=await interaction.channel.send({embeds:[new EmbedBuilder().setColor(winner?0x00E676:PURPLE)
      .setDescription('<@'+players[0].id+'> floor **'+r1.floor+'** / '+FLOORS+'\n<@'+players[1].id+'> floor **'+r2.floor+'** / '+FLOORS+'\n\n'+line)
      .setImage(winner?IMAGES.win:IMAGES.tower).setThumbnail(IMAGES.logo).setTimestamp().setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
    await log(client,{user:winner||players[0],game:'1v1 Tower Climb',result:winner?'WIN':'TIE',detail:players[0].username+': floor '+r1.floor+' vs '+players[1].username+': floor '+r2.floor});
  },
};
