const { SlashCommandBuilder } = require('discord.js');
const { em, wait, hmacRoll, secureShuffle } = require('../utils/theme');
const { log } = require('../utils/logger');
const TOTAL_FLOORS=5;
async function playFloor(channel,user,floorNum,totalFloors){
  const minePos=hmacRoll(0,2);
  await channel.send({embeds:[em('Konvault\' Tower Climb','**Floor '+floorNum+' / '+totalFloors+'**\n\n<@'+user.id+'> — type `1`, `2`, or `3` to pick your tile\n⏳  30 seconds')]});
  let pick=null;
  try{
    const col=await channel.awaitMessages({filter:m=>m.author.id===user.id&&['1','2','3'].includes(m.content.trim()),max:1,time:30000,errors:['time']});
    pick=parseInt(col.first().content.trim())-1;
    await col.first().delete().catch(()=>{});
  }catch{return{result:'timeout'};}
  const safe=pick!==minePos;
  const tiles=[0,1,2].map(i=>i===minePos?'💣 Tile '+(i+1):i===pick&&safe?'✅ Tile '+(i+1):'⬜ Tile '+(i+1));
  if(safe){
    await channel.send({embeds:[em('Konvault\' Tower Climb','**Floor '+floorNum+'**\n\n'+tiles.join('  •  ')+'\n\n✅  <@'+user.id+'> picked Tile '+(pick+1)+' — SAFE!\n\n'+(floorNum<totalFloors?'⬆️  Climbing to floor '+(floorNum+1)+'...':'🏆  Reached the top!'))]});
    return{result:'safe',floor:floorNum};
  }else{
    await channel.send({embeds:[em('Konvault\' Tower Climb','**Floor '+floorNum+'**\n\n'+tiles.join('  •  ')+'\n\n💥  <@'+user.id+'> picked Tile '+(pick+1)+' — MINE!\n\nEliminated at floor **'+floorNum+'**',null,'loss')]});
    return{result:'dead',floor:floorNum-1};
  }
}
module.exports = {
  data: new SlashCommandBuilder().setName('tower').setDescription('🗼  1v1 Tower Climb — climb higher to win!')
    .addUserOption(o=>o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),
  async execute(interaction,client){
    const opponent=interaction.options.getUser('opponent');
    if(opponent.id===interaction.user.id)return interaction.reply({content:'🚫  You cannot play yourself.',ephemeral:true});
    if(opponent.bot)return interaction.reply({content:'🚫  Cannot play against a bot.',ephemeral:true});
    await interaction.reply({content:`<@${opponent.id}>`,embeds:[em('Konvault\' Tower Climb','<@'+interaction.user.id+'> challenged <@'+opponent.id+'> to **1v1 Tower Climb!**\n\n🗼  **'+TOTAL_FLOORS+' floors** — pick tile 1, 2, or 3 each floor\n💣  One tile hides a mine — pick wrong = eliminated\nHighest floor wins!\n\n<@'+opponent.id+'> — type `accept` or `decline`',null,'tower')]});
    let accepted=false;
    try{const col=await interaction.channel.awaitMessages({filter:m=>m.author.id===opponent.id&&['accept','decline'].includes(m.content.toLowerCase().trim()),max:1,time:30000,errors:['time']});accepted=col.first().content.toLowerCase().trim()==='accept';await col.first().delete().catch(()=>{});}
    catch{return interaction.channel.send({embeds:[em('Konvault\' Tower Climb','⏰  No response. Cancelled.')]});}
    if(!accepted)return interaction.channel.send({embeds:[em('Konvault\' Tower Climb','❌  <@'+opponent.id+'> declined.')]});
    const players=secureShuffle([interaction.user,opponent]);
    await interaction.channel.send({embeds:[em('Konvault\' Tower Climb','🗼  Game on!\n\n**'+players[0].displayName+'** goes first\n\nType `1` `2` or `3` to pick a tile each floor',null,'tower')]});
    await wait(1000);
    const scores={[players[0].id]:0,[players[1].id]:0};
    for(let floor=1;floor<=TOTAL_FLOORS;floor++){
      for(const player of players){
        if(scores[player.id]===-1)continue;
        await interaction.channel.send({embeds:[em('Konvault\' Tower Climb','─────────────────────\n🗼  **'+player.displayName+'\'s turn**  •  Floor **'+floor+'** / '+TOTAL_FLOORS+'\n─────────────────────')]});
        await wait(500);
        const res=await playFloor(interaction.channel,player,floor,TOTAL_FLOORS);
        if(res.result==='timeout')return interaction.channel.send({embeds:[em('Konvault\' Tower Climb','⏰  <@'+player.id+'> timed out. Cancelled.')]});
        scores[player.id]=res.result==='dead'?floor-1:floor;
        if(res.result==='dead')scores[player.id]=-1;
        await wait(800);
      }
    }
    const s0=scores[players[0].id]===-1?scores[players[0].id]===0?0:Math.max(0,scores[players[0].id]):scores[players[0].id];
    const s1=scores[players[1].id]===-1?Math.max(0,scores[players[1].id]):scores[players[1].id];
    const fs0=scores[players[0].id]===-1?'ELIMINATED':scores[players[0].id];
    const fs1=scores[players[1].id]===-1?'ELIMINATED':scores[players[1].id];
    let line,winner;
    const real0=scores[players[0].id]===-1?0:scores[players[0].id];
    const real1=scores[players[1].id]===-1?0:scores[players[1].id];
    if(real0>real1){winner=players[0];line='🏆  **<@'+players[0].id+'> wins!**';}
    else if(real1>real0){winner=players[1];line='🏆  **<@'+players[1].id+'> wins!**';}
    else{line='🤝  **TIE!**';}
    await interaction.channel.send({embeds:[em('Konvault\' Tower Climb — Result','<@'+players[0].id+'>  Floor **'+fs0+'** / '+TOTAL_FLOORS+'\n<@'+players[1].id+'>  Floor **'+fs1+'** / '+TOTAL_FLOORS+'\n\n'+line,null,winner?'win':'tower')]});
    await log(client,{user:winner??players[0],game:'1v1 Tower Climb',result:winner?'WIN':'TIE',detail:players[0].username+': floor '+fs0+'  vs  '+players[1].username+': floor '+fs1});
  },
};
