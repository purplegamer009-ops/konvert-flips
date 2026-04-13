const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');
const { log } = require('../utils/logger');
const BEATS = { rock:'scissors', paper:'rock', scissors:'paper' };
const E = { rock:'🪨', paper:'📄', scissors:'✂️' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('✂️  1v1 RPS — picks sent via DM!')
    .addUserOption(o => o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),

  async execute(interaction, client) {
    const opponent = interaction.options.getUser('opponent');
    if (opponent.id === interaction.user.id) return interaction.reply({ content: '🚫  You cannot play yourself.', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: '🚫  Cannot play against a bot.', ephemeral: true });

    await interaction.reply({ embeds: [em('Konvert Flips RPS',
      '<@' + interaction.user.id + '> vs <@' + opponent.id + '>\n\n📩  **Both players check your DMs!**\nType your move there — nobody can see it.'
    )] });

    const picks = {};

    async function getPick(user) {
      try {
        const dm = await user.createDM();
        await dm.send({ embeds: [em('Konvert Flips RPS', 'Type your move now:\n`rock`  `paper`  `scissors`')] });
        const collected = await dm.awaitMessages({
          filter: m => m.author.id === user.id && ['rock','paper','scissors'].includes(m.content.toLowerCase().trim()),
          max: 1,
          time: 30000,
          errors: ['time'],
        });
        picks[user.id] = collected.first().content.toLowerCase().trim();
        await dm.send({ embeds: [em('Konvert Flips RPS', '✅  Locked in — waiting for opponent...')] });
      } catch {
        picks[user.id] = null;
      }
    }

    await Promise.all([getPick(interaction.user), getPick(opponent)]);

    if (!picks[interaction.user.id] || !picks[opponent.id]) {
      return interaction.channel.send({ embeds: [em('Konvert Flips RPS', '⏰  Someone did not pick in time. Game cancelled.')] });
    }

    const p1 = picks[interaction.user.id];
    const p2 = picks[opponent.id];

    let line, winner;
    if (p1 === p2) { line = '🤝  TIE! Both picked ' + E[p1]; }
    else if (BEATS[p1] === p2) { winner = interaction.user; line = '🏆  <@' + interaction.user.id + '> wins!  ' + E[p1] + ' beats ' + E[p2]; }
    else { winner = opponent; line = '🏆  <@' + opponent.id + '> wins!  ' + E[p2] + ' beats ' + E[p1]; }

    await interaction.channel.send({ embeds: [em('Konvert Flips RPS  —  Result',
      '<@' + interaction.user.id + '>  ' + E[p1] + '  ' + p1.toUpperCase() + '\n<@' + opponent.id + '>  ' + E[p2] + '  ' + p2.toUpperCase() + '\n\n' + line
    )] });

    await log(client, { user: winner ?? interaction.user, game: '1v1 RPS', result: winner ? 'WIN' : 'TIE', detail: interaction.user.username + ': ' + p1 + ' vs ' + opponent.username + ': ' + p2 });
  },
};
