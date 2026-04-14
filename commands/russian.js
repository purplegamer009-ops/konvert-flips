const { SlashCommandBuilder } = require('discord.js');
const { em, wait, rnd } = require('../utils/theme');
const { log } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('russian')
    .setDescription('🔫  1v1 Russian Roulette — take turns until someone gets shot!')
    .addUserOption(o => o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),

  async execute(interaction, client) {
    const opponent = interaction.options.getUser('opponent');
    if (opponent.id === interaction.user.id) return interaction.reply({ content: '🚫  You cannot play yourself.', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: '🚫  Cannot play against a bot.', ephemeral: true });

    await interaction.reply({ embeds: [em('Konvert Flips\' Russian Roulette',
      '<@' + interaction.user.id + '> challenged <@' + opponent.id + '> to **1v1 Russian Roulette!**\n\n' +
      '🔫  Take turns pulling the trigger — one bullet in 6 chambers.\n' +
      'The cylinder resets each round. First to get shot loses.\n\n' +
      '<@' + opponent.id + '> — type `accept` or `decline`'
    )] });

    let accepted = false;
    try {
      const col = await interaction.channel.awaitMessages({
        filter: m => m.author.id === opponent.id && ['accept','decline'].includes(m.content.toLowerCase().trim()),
        max: 1, time: 30000, errors: ['time'],
      });
      accepted = col.first().content.toLowerCase().trim() === 'accept';
      await col.first().delete().catch(() => {});
    } catch {
      return interaction.channel.send({ embeds: [em('Konvert Flips\' Russian Roulette', '⏰  No response. Game cancelled.')] });
    }

    if (!accepted) return interaction.channel.send({ embeds: [em('Konvert Flips\' Russian Roulette', '❌  <@' + opponent.id + '> declined.')] });

    // Randomly pick who goes first
    const players = Math.random() < 0.5
      ? [interaction.user, opponent]
      : [opponent, interaction.user];

    await interaction.channel.send({ embeds: [em('Konvert Flips\' Russian Roulette',
      '🎲  Randomly selected order:\n\n' +
      '**1st:** <@' + players[0].id + '>\n' +
      '**2nd:** <@' + players[1].id + '>\n\n' +
      '🔫  Loading the cylinder...'
    )] });

    await wait(1500);

    let round = 1;
    let loser = null;

    while (!loser) {
      for (const player of players) {
        await interaction.channel.send({ embeds: [em('Konvert Flips\' Russian Roulette',
          '**Round ' + round + '**\n\n' +
          '<@' + player.id + '> raises the gun...\n🔫  ...'
        )] });

        await wait(1500);

        const shot = rnd(1, 6) === 1;

        if (shot) {
          await interaction.channel.send({ embeds: [em('Konvert Flips\' Russian Roulette',
            '**Round ' + round + '**\n\n' +
            '# 💥  BANG!\n\n' +
            '<@' + player.id + '> got shot!\n\n' +
            '🏆  **<@' + (player.id === players[0].id ? players[1].id : players[0].id) + '> wins!**'
          )] });
          loser = player;
          break;
        } else {
          await interaction.channel.send({ embeds: [em('Konvert Flips\' Russian Roulette',
            '**Round ' + round + '**\n\n' +
            '🔔  **CLICK** — Empty chamber.\n\n' +
            '<@' + player.id + '> survived... passing the gun.'
          )] });
          await wait(1000);
        }

        if (loser) break;
      }
      round++;
    }

    const winner = loser.id === players[0].id ? players[1] : players[0];

    await log(client, {
      user: winner,
      game: '1v1 Russian Roulette',
      result: 'WIN',
      detail: winner.username + ' survived  •  ' + loser.username + ' got shot in round ' + (round - 1),
    });
  },
};
