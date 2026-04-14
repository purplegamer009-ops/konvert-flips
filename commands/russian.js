const { SlashCommandBuilder } = require('discord.js');
const { em, wait, hmacRoll, secureShuffle } = require('../utils/theme');
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
      '🔫  Take turns pulling the trigger — 1 bullet in 6 chambers.\n' +
      'Cylinder resets each turn. First to get shot loses.\n\n' +
      '<@' + opponent.id + '> — type `accept` or `decline`'
    )] });
    let accepted = false;
    try {
      const col = await interaction.channel.awaitMessages({ filter: m => m.author.id === opponent.id && ['accept','decline'].includes(m.content.toLowerCase().trim()), max: 1, time: 30000, errors: ['time'] });
      accepted = col.first().content.toLowerCase().trim() === 'accept';
      await col.first().delete().catch(() => {});
    } catch { return interaction.channel.send({ embeds: [em('Konvert Flips\' Russian Roulette', '⏰  No response. Game cancelled.')] }); }
    if (!accepted) return interaction.channel.send({ embeds: [em('Konvert Flips\' Russian Roulette', '❌  <@' + opponent.id + '> declined.')] });
    const players = secureShuffle([interaction.user, opponent]);
    await interaction.channel.send({ embeds: [em('Konvert Flips\' Russian Roulette',
      '🎲  Randomly selected order:\n\n**1st:** <@' + players[0].id + '>\n**2nd:** <@' + players[1].id + '>\n\n🔫  Loading the cylinder...'
    )] });
    await wait(1500);
    let round = 1;
    while (true) {
      for (const player of players) {
        await interaction.channel.send({ embeds: [em('Konvert Flips\' Russian Roulette', '**Round ' + round + '**\n\n<@' + player.id + '> raises the gun...\n🔫  ...')] });
        await wait(1500);
        const shot = hmacRoll(1, 6) === 1;
        if (shot) {
          const winner = player.id === players[0].id ? players[1] : players[0];
          await interaction.channel.send({ embeds: [em('Konvert Flips\' Russian Roulette', '**Round ' + round + '**\n\n# 💥  BANG!\n\n<@' + player.id + '> got shot!\n\n🏆  **<@' + winner.id + '> wins!**')] });
          await log(client, { user: winner, game: '1v1 Russian Roulette', result: 'WIN', detail: winner.username + ' survived — ' + player.username + ' got shot in round ' + round });
          return;
        }
        await interaction.channel.send({ embeds: [em('Konvert Flips\' Russian Roulette', '**Round ' + round + '**\n\n🔔  **CLICK** — Empty chamber.\n\n<@' + player.id + '> survived... passing the gun.')] });
        await wait(1000);
      }
      round++;
    }
  },
};
