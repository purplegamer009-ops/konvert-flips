const { SlashCommandBuilder } = require('discord.js');
const { em, wait, hmacFloat, hmacFloat2 } = require('../utils/theme');
function roll(){const r=hmacFloat();if(r<0.01)return hmacFloat2(50,100);if(r<0.05)return hmacFloat2(20,50);if(r<0.15)return hmacFloat2(10,20);if(r<0.35)return hmacFloat2(5,10);if(r<0.65)return hmacFloat2(2,5);return hmacFloat2(1,2);}
module.exports = {
  data: new SlashCommandBuilder().setName('limbo').setDescription('🚀  Launch into Limbo'),
  async execute(interaction) {
    await interaction.deferReply();
    await interaction.editReply({ embeds: [em('Konvault\' Limbo','🚀  Launching...', null, 'limbo')] });
    await wait(1000);
    const m=roll();
    await interaction.editReply({ embeds: [em('Konvault\' Limbo','**'+interaction.user.displayName+'** landed on **'+m+'x**', null, 'limbo')] });
  },
};
