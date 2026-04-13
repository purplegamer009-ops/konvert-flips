const { SlashCommandBuilder } = require('discord.js');
const { em, wait } = require('../utils/theme');
const { log } = require('../utils/logger');
const BEATS = { rock:'scissors', paper:'rock', scissors:'paper' };
const E = { rock:'🪨', paper:'📄', scissors:'✂️' };
module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('✂️  1v1 RPS')
    .addUserOption(o => o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),
  async execute(interaction, client) {
    const opponent = interaction.options.getUser('opponent');
    if (opponent.id === interaction.user.id) return interaction.reply({ content: '🚫  You cannot play yourself.', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: '🚫  Cannot play against a bot.', ephemeral: true });
    await interaction.reply({ embeds: [em('Konvert Flips RPS', '<@' + interaction.user.id + '> vs <@' + opponent.id + '>\n\nBoth players type your move in chat:\nrock  paper  scissors\n\n30 seconds each')] });
    const picks = {};
    const order = [interaction.user.id, opponent.id];
    for (const userId of order) {
      await interaction.channel.send({ embeds: [em('Konvert Flips RPS', '<@' + userId + '> type rock, paper, or scissors now')] });
      try {
        const col = await interaction.channel.awaitMessages({ filter: m => m.author.id === userId && ['rock','paper','scissors'].includes(m.content.toLowerCase().trim()), max: 1, time: 30000, errors: ['time'] });
        picks[userId] = col.first().content.toLowerCase().trim();
        await col.first().delete().catch(() => {});
        await interaction.channel.send({ embeds: [em('Konvert Flips RPS', '<@' + userId + '> locked in ✅')] });
      } catch {
        return interaction.channel.send({ embeds: [em('Konvert Flips RPS', '<@' + userId + '> did not pick in time. Game cancelled.')] });
      }
    }
    const p1 = picks[interaction.user.id];
    const p2 = picks[opponent.id];
    let line, winner;
    if (p1 === p2) { line = 'TIE! Both picked ' + E[p1]; }
    else if (BEATS[p1] === p2) { winner = interaction.user; line = '<@' + interaction.user.id + '> wins! ' + E[p1] + ' beats ' + E[p2]; }
    else { winner = opponent; line = '<@' + opponent.id + '> wins! ' + E[p2] + ' beats ' + E[p1]; }
    await interaction.channel.send({ embeds: [em('Konvert Flips RPS Result', '<@' + interaction.user.id + '>  ' + E[p1] + '  ' + p1.toUpperCase() + '\n<@' + opponent.id + '>  ' + E[p2] + '  ' + p2.toUpperCase() + '\n\n' + line)] });
    await log(client, { user: winner ?? interaction.user, game: '1v1 RPS', result: winner ? 'WIN' : 'TIE', detail: interaction.user.username + ': ' + p1 + ' vs ' + opponent.username + ': ' + p2 });
  },
};
