const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');
const { log } = require('../utils/logger');
const BEATS = { rock:'scissors', paper:'rock', scissors:'paper' };
const E = { rock:'🪨', paper:'📄', scissors:'✂️' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('✂️  1v1 RPS — picks sent via DM so nobody can cheat!')
    .addUserOption(o => o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),

  async execute(interaction, client) {
    const opponent = interaction.options.getUser('opponent');
    if (opponent.id === interaction.user.id) return interaction.reply({ content: '🚫  You cannot play yourself.', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: '🚫  Cannot play against a bot.', ephemeral: true });

    await interaction.reply({ embeds: [em('Konvert Flips RPS',
      '<@' + interaction.user.id + '> vs <@' + opponent.id + '>\n\n📩  **Both players check your DMs from the bot!**\n Type your move there — nobody can see it.'
    )] });

    // DM both players
    let dm1, dm2;
    try {
      dm1 = await interaction.user.createDM();
      await dm1.send({ embeds: [em('Konvert Flips RPS', 'Type your move: `rock` `paper` or `scissors`')] });
    } catch {
      return interaction.channel.send({ embeds: [em('Konvert Flips RPS', '❌  Could not DM <@' + interaction.user.id + '>. Enable DMs from server members and try again.')] });
    }

    try {
      dm2 = await opponent.createDM();
      await dm2.send({ embeds: [em('Konvert Flips RPS', 'Type your move: `rock` `paper` or `scissors`')] });
    } catch {
      return interaction.channel.send({ embeds: [em('Konvert Flips RPS', '❌  Could not DM <@' + opponent.id + '>. They need to enable DMs from server members.')] });
    }

    // Collect both picks via DM
    const filter1 = m => ['rock','paper','scissors'].includes(m.content.toLowerCase().trim());
    const filter2 = m => ['rock','paper','scissors'].includes(m.content.toLowerCase().trim());

    let p1, p2;
    try {
      const [col1, col2] = await Promise.all([
        dm1.awaitMessages({ filter: filter1, max: 1, time: 30000, errors: ['time'] }),
        dm2.awaitMessages({ filter: filter2, max: 1, time: 30000, errors: ['time'] }),
      ]);
      p1 = col1.first().content.toLowerCase().trim();
      p2 = col2.first().content.toLowerCase().trim();
    } catch {
      return interaction.channel.send({ embeds: [em('Konvert Flips RPS', '⏰  Someone did not pick in time. Game cancelled.')] });
    }

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
