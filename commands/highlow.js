const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { em, wait, hmacRoll } = require('../utils/theme');
const { log } = require('../utils/logger');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('highlow')
    .setDescription('🔢  1v1 Higher or Lower')
    .addUserOption(o => o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),
  async execute(interaction, client) {
    const opponent=interaction.options.getUser('opponent');
    if(opponent.id===interaction.user.id)return interaction.reply({content:'🚫  You cannot play yourself.',ephemeral:true});
    if(opponent.bot)return interaction.reply({content:'🚫  Cannot play against a bot.',ephemeral:true});
    await interaction.reply({embeds:[em('Konvault\' Higher or Lower','<@'+interaction.user.id+'> challenged <@'+opponent.id+'> to **Higher or Lower!**\n\n🔢  Guess the secret number between **1 and 100**\nFirst to guess correctly wins\n\n<@'+opponent.id+'> — type `accept` or `decline`')]});
    let accepted=false;
    try{const col=await interaction.channel.awaitMessages({filter:m=>m.author.id===opponent.id&&['accept','decline'].includes(m.content.toLowerCase().trim()),max:1,time:30000,errors:['time']});accepted=col.first().content.toLowerCase().trim()==='accept';await col.first().delete().catch(()=>{});}
    catch{return interaction.channel.send({embeds:[em('Konvault\' Higher or Lower','⏰  No response. Game cancelled.')]});}
    if(!accepted)return interaction.channel.send({embeds:[em('Konvault\' Higher or Lower','❌  <@'+opponent.id+'> declined.')]});
    const secret=hmacRoll(1,100);
    const players=[interaction.user,opponent];
    let currentIndex=0,guessCount=0;
    await interaction.channel.send({embeds:[em('Konvault\' Higher or Lower','🎮  Game on!\n\n🔢  Secret number locked in: **???**\n\n<@'+players[0].id+'> goes first!')]});
    await wait(500);
    while(true){
      const currentPlayer=players[currentIndex%2];
      guessCount++;
      const guessRow=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('hilo_guess_'+currentPlayer.id+'_'+guessCount).setLabel('🔢  Enter Your Guess').setStyle(ButtonStyle.Primary));
      const turnMsg=await interaction.channel.send({embeds:[em('Konvault\' Higher or Lower','<@'+currentPlayer.id+'> — your turn!\nClick the button to guess secretly.')],components:[guessRow]});
      const guess=await new Promise(resolve=>{
        const timeout=setTimeout(()=>resolve(null),60000);
        const col=turnMsg.createMessageComponentCollector({filter:b=>b.user.id===currentPlayer.id&&b.customId==='hilo_guess_'+currentPlayer.id+'_'+guessCount,time:60000,max:1});
        col.on('collect',async btn=>{
          const modal=new ModalBuilder().setCustomId('hilo_input_'+currentPlayer.id+'_'+guessCount).setTitle('Your Guess');
          const input=new TextInputBuilder().setCustomId('guess_value').setLabel('Enter a number between 1 and 100').setStyle(TextInputStyle.Short).setPlaceholder('e.g. 42').setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          await btn.showModal(modal);
          try{const submitted=await btn.awaitModalSubmit({time:60000,filter:i=>i.user.id===currentPlayer.id});const val=parseInt(submitted.fields.getTextInputValue('guess_value'));if(isNaN(val)||val<1||val>100){await submitted.reply({content:'❌  Must be 1–100.',ephemeral:true});clearTimeout(timeout);return resolve(null);}await submitted.reply({content:'✅  **'+val+'** submitted!',ephemeral:true});clearTimeout(timeout);resolve(val);}
          catch{clearTimeout(timeout);resolve(null);}
        });
        col.on('end',(_,r)=>{if(r==='time'){clearTimeout(timeout);resolve(null);}});
      });
      await turnMsg.edit({components:[]}).catch(()=>{});
      if(!guess)return interaction.channel.send({embeds:[em('Konvault\' Higher or Lower','⏰  <@'+currentPlayer.id+'> took too long. Game cancelled.')]});
      if(guess===secret){
        const winner=currentPlayer;
        await interaction.channel.send({embeds:[em('Konvault\' Higher or Lower — Result','<@'+currentPlayer.id+'> guessed **'+guess+'**\n\n✅  **CORRECT!**\n\n🏆  **<@'+winner.id+'> wins!**\n🔢  Secret was **'+secret+'**\n📊  Guesses: **'+guessCount+'**')]});
        await log(client,{user:winner,game:'Higher or Lower',result:'WIN',detail:winner.username+' guessed '+secret+' in '+guessCount+' guesses'});
        return;
      }
      const hint=guess<secret?'📈  **Higher!**':'📉  **Lower!**';
      await interaction.channel.send({embeds:[em('Konvault\' Higher or Lower','<@'+currentPlayer.id+'> guessed **'+guess+'**\n\n'+hint+'\n\n<@'+players[(currentIndex+1)%2].id+'> — your turn!')]});
      currentIndex++;
    }
  },
};
