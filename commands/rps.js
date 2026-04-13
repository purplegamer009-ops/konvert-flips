const { SlashCommandBuilder } = require('discord.js');
const { em, wait } = require('../utils/theme');
const { log } = require('../utils/logger');

const BEATS = { rock:'scissors', paper:'rock', scissors:'paper' };
const E = { rock:'🪨', paper:'📄', scissors:'✂️' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('✂️  1v1 RPS — both players type their move in chat')
    .addUserOption(o => o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),

  async execute(interaction, client) {
    const opponent = interaction.options.getUser('opponent');
    if (opponent.id === interaction.user.id) return interaction.reply({ content: '🚫  You cannot play yourself.', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: '🚫  Cannot play against a bot.', ephemeral: true });

    await interaction.deferReply();
    await interaction.editReply({ embeds: [em('Konvert Flips\' RPS',
      `<@${interaction.user.id}> vs <@${opponent.id}>\n\nBoth players type your move:\n\`rock\` \`paper\` \`scissors\`\
