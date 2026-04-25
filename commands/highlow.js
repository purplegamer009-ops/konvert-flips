const { SlashCommandBuilder } = require('discord.js');
const { em, wait, hmacRoll } = require('../utils/theme');
const { log } = require('../utils/logger');
const { addRematch } = require('../utils/rematch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('highlow')
    .setDescription('🔢  1v1 Higher or Lower — guess the secret number!')
    .addUserOption(o => o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),

  async execute(interaction, client) {
    const opponent = interaction.options.getUser('opponent');
    if (opponent.id === interaction.user.id) return interaction.reply({ content: '🚫  Cannot play yourself.', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: '🚫  Cannot play a bot.', ephemeral: true });

    await interaction.reply({
      content: '<@' + opponent.id + '>',
      embeds: [em('Konvault\' Higher or Lower', '<@' + interaction.user.id + '> challenged <@' + opponent.id + '>\n\n🔢  Guess 1–100 — type in chat\nFirst correct guess wins\n\n<@' + opponent.id + '> — type `accept` or `decline`', null, 'highlow')]
    });

    let accepted = false;
    try {
      const col = await interaction.channel.awaitMessages({ filter: m => m.author.id === opponent.id && ['accept','decline'].includes(m.content.toLowerCase().trim()), max: 1, time: 30000, errors: ['time'] });
      accepted = col.first().content.toLowerCase().trim() === 'accept';
      await col.first().delete().catch(() => {});
    } catch { return interaction.channel.send({ embeds: [em('Konvault\' Higher or Lower', '⏰  No response.')] }); }
    if (!accepted) return interaction.channel.send({ embeds: [em('Konvault\' Higher or Lower', '❌  Declined.')] });

    const secret = hmacRoll(1, 100);
    const players = [interaction.user, opponent];
    let currentIndex = 0, guessCount = 0;

    await interaction.channel.send({ embeds: [em('Konvault\' Higher or Lower', '🎮  Game on! Secret number locked: **???**\n\n<@' + players[0].id + '> goes first — type a number!', null, 'highlow')] });

    while (true) {
      const currentPlayer = players[currentIndex % 2];
      guessCount++;
      await interaction.channel.send({ embeds: [em('Konvault\' Higher or Lower', '<@' + currentPlayer.id + '> — guess (1–100) ⏳  30s')] });

      let guess = null;
      try {
        const col = await interaction.channel.awaitMessages({
          filter: m => m.author.id === currentPlayer.id && !isNaN(parseInt(m.content.trim())) && parseInt(m.content.trim()) >= 1 && parseInt(m.content.trim()) <= 100,
          max: 1, time: 30000, errors: ['time']
        });
        guess = parseInt(col.first().content.trim());
        await col.first().delete().catch(() => {});
      } catch { return interaction.channel.send({ embeds: [em('Konvault\' Higher or Lower', '⏰  <@' + currentPlayer.id + '> timed out.')] }); }

      if (guess === secret) {
        const winner = currentPlayer;
        const resultMsg = await interaction.channel.send({ embeds: [em('Konvault\' Higher or Lower', '<@' + currentPlayer.id + '> guessed **' + guess + '**\n\n✅  CORRECT!\n\n🏆  **<@' + winner.id + '> wins!**\n🔢  Secret: **' + secret + '**  •  Guesses: **' + guessCount + '**', null, 'win')] });
        await log(client, { user: winner, game: 'Higher or Lower', result: 'WIN', detail: winner.username + ' guessed ' + secret + ' in ' + guessCount + ' guesses' });
        await addRematch(interaction.channel, resultMsg, interaction.user, opponent, 'highlow');
        return;
      }

      const hint = guess < secret ? '📈  Higher!' : '📉  Lower!';
      await interaction.channel.send({ embeds: [em('Konvault\' Higher or Lower', '<@' + currentPlayer.id + '> guessed **' + guess + '**\n\n' + hint + '\n\n<@' + players[(currentIndex+1)%2].id + '> — your turn!')] });
      currentIndex++;
    }
  },
};
