const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { PURPLE } = require('../utils/theme');
module.exports = {
  data: new SlashCommandBuilder().setName('logresult').setDescription('📋  Owner: manually log a game result')
    .addUserOption(o=>o.setName('player').setDescription('The player').setRequired(true))
    .addStringOption(o=>o.setName('game').setDescription('Game name').setRequired(true))
    .addStringOption(o=>o.setName('result').setDescription('WIN / LOSS / TIE').setRequired(true).addChoices({name:'✅  WIN',value:'WIN'},{name:'❌  LOSS',value:'LOSS'},{name:'🤝  TIE',value:'TIE'}))
    .addStringOption(o=>o.setName('amount').setDescription('Amount won/lost').setRequired(false))
    .addStringOption(o=>o.setName('note').setDescription('Any extra notes').setRequired(false)),
  async execute(interaction){
    if(interaction.user.id!==process.env.OWNER_ID)return interaction.reply({content:'🚫  Owner only.',ephemeral:true});
    const player=interaction.options.getUser('player');
    const game=interaction.options.getString('game');
    const result=interaction.options.getString('result');
    const amount=interaction.options.getString('amount');
    const note=interaction.options.getString('note');
    const isWin=result==='WIN',isLoss=result==='LOSS';
    const color=isWin?0x00E676:isLoss?0xFF1744:PURPLE;
    const logChannelId=process.env.LOG_CHANNEL_ID;
    if(!logChannelId)return interaction.reply({content:'⚠️  LOG_CHANNEL_ID not set.',ephemeral:true});
    const channel=await interaction.client.channels.fetch(logChannelId).catch(()=>null);
    if(!channel)return interaction.reply({content:'⚠️  Could not find log channel.',ephemeral:true});
    const embed=new EmbedBuilder().setColor(color)
      .setTitle((isWin?'✅':isLoss?'❌':'🤝')+'  '+game+'  —  '+result)
      .setDescription(['👤  **Player:** <@'+player.id+'>  ('+player.username+')','🎮  **Game:** '+game,'📊  **Result:** '+result,amount?'💰  **Amount:** '+amount:null,note?'📝  **Note:** '+note:null,'🔧  **Logged by:** <@'+interaction.user.id+'>'].filter(Boolean).join('\n'))
      .setTimestamp().setFooter({text:'KONVAULT™  •  Manual Log'});
    await channel.send({embeds:[embed]});
    await interaction.reply({content:'✅  Result logged to <#'+logChannelId+'>',ephemeral:true});
  },
};
