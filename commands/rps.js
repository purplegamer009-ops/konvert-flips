const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');
const { log } = require('../utils/logger');
const BEATS={rock:'scissors',paper:'rock',scissors:'paper'};
const E={rock:'🪨',paper:'📄',scissors:'✂️'};
module.exports = {
  data: new SlashCommandBuilder().setName('rps').setDescription('✂️  1v1 RPS — picks sent via DM!')
    .addUserOption(o=>o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),
  async execute(interaction,client) {
    const opponent=interaction.options.getUser('opponent');
    if(opponent.id===interaction.user.id)return interaction.reply({content:'🚫  You cannot play yourself.',ephemeral:true});
    if(opponent.bot)return interaction.reply({content:'🚫  Cannot play against a bot.',ephemeral:true});
    await interaction.reply({content:`<@${opponent.id}>`,embeds:[em('Konvault\' RPS','<@'+interaction.user.id+'> challenged <@'+opponent.id+'> to **RPS!**\n\n📩  Both players check your DMs!\nType your move — nobody can see it.', null,'rps')]});
    const picks={};
    async function getPick(user){
      try{const dm=await user.createDM();await dm.send({embeds:[em('Konvault\' RPS','Type your move:\n`rock`  `paper`  `scissors`\n\n60 seconds.',null,'rps')]});}catch{return null;}
      return new Promise(resolve=>{
        const timeout=setTimeout(()=>{client.off('messageCreate',handler);resolve(null);},60000);
        function handler(msg){if(msg.author.id!==user.id||msg.guild)return;if(!['rock','paper','scissors'].includes(msg.content.toLowerCase().trim()))return;clearTimeout(timeout);client.off('messageCreate',handler);msg.author.createDM().then(dm=>dm.send({embeds:[em('Konvault\' RPS','✅  Locked in! Waiting...')]})).catch(()=>{});resolve(msg.content.toLowerCase().trim());}
        client.on('messageCreate',handler);
      });
    }
    const [p1,p2]=await Promise.all([getPick(interaction.user),getPick(opponent)]);
    if(!p1||!p2)return interaction.channel.send({embeds:[em('Konvault\' RPS','⏰  Someone did not pick. Game cancelled.')]});
    let line,winner;
    if(p1===p2){line='🤝  TIE! Both picked '+E[p1];}
    else if(BEATS[p1]===p2){winner=interaction.user;line='🏆  **<@'+interaction.user.id+'> wins!**  '+E[p1]+' beats '+E[p2];}
    else{winner=opponent;line='🏆  **<@'+opponent.id+'> wins!**  '+E[p2]+' beats '+E[p1];}
    await interaction.channel.send({embeds:[em('Konvault\' RPS — Result','<@'+interaction.user.id+'>  '+E[p1]+'  **'+p1.toUpperCase()+'**\n<@'+opponent.id+'>  '+E[p2]+'  **'+p2.toUpperCase()+'**\n\n'+line,null,winner?'win':'rps')]});
    await log(client,{user:winner??interaction.user,game:'1v1 RPS',result:winner?'WIN':'TIE',detail:interaction.user.username+': '+p1+'  vs  '+opponent.username+': '+p2});
  },
};
