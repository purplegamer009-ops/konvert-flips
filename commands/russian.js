const { SlashCommandBuilder } = require('discord.js');
const { em, wait, hmacRoll, secureShuffle } = require('../utils/theme');
const { log } = require('../utils/logger');
const { addRematch } = require('../utils/rematch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('russian')
    .setDescription('🔫  1v1 Russian Roulette — take turns until someone gets shot!')
    .addUserOption(o => o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),

  async execute(interaction, client) {
    const opponent = interaction.options.getUser('opponent');
    if (opponent.id === interaction.user.id) return interaction.reply({ content: '🚫  Cannot play yourself.', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: '🚫  Cannot play a bot.', ephemeral: true });

    await interaction.reply({
      content: '<@' + opponent.id + '>',
      embeds: [em('Konvault\' Russian Roulette', '<@' + interaction.user.id + '> challenged <@' + opponent.id + '>\n\n🔫  1 bullet in 6 chambers — take turns pulling the trigger\n\n<@' + opponent.id + '> — type `accept` or `decline`', null, 'russian')]
    });

    let accepted = false;
    try {
      const col = await interaction.channel.awaitMessages({ filter: m => m.author.id === opponent.id && ['accept','decline'].includes(m.content.toLowerCase().trim()), max: 1, time: 30000, errors: ['time'] });
      accepted = col.first().content.toLowerCase().trim() === 'accept';
      await col.first().delete().catch(() => {});
    } catch { return interaction.channel.send({ embeds: [em('Konvault\' Russian Roulette', '⏰  No response.')] }); }
    if (!accepted) return interaction.channel.send({ embeds: [em('Konvault\' Russian Roulette', '❌  Declined.')] });

    const players = secureShuffle([interaction.user, opponent]);
    await interaction.channel.send({ embeds: [em('Konvault\' Russian Roulette', '**Order:**\n1️⃣  <@' + players[0].id + '>\n2️⃣  <@' + players[1].id + '>\n\n🔫  Loading...', null, 'russian')] });
    await wait(1500);

    let round = 1;
    while (true) {
      for (const player of players) {
        await interaction.channel.send({ embeds: [em('Konvault\' Russian Roulette', '**Round ' + round + '**\n\n<@' + player.id + '> raises the gun... 🔫')] });
        await wait(1500);
        const shot = hmacRoll(1, 6) === 1;
        if (shot) {
          const winner = player.id === players[0].id ? players[1] : players[0];
          const resultMsg = await interaction.channel.send({ embeds: [em('Konvault\' Russian Roulette', '# 💥  BANG!\n\n<@' + player.id + '> got shot!\n\n🏆  **<@' + winner.id + '> wins!**', null, 'win')] });
          await log(client, { user: winner, game: '1v1 Russian Roulette', result: 'WIN', detail: winner.username + ' survived — ' + player.username + ' shot in round ' + round });
          await addRematch(interaction.channel, resultMsg, interaction.user, opponent, 'russian');
          return;
        }
        await interaction.channel.send({ embeds: [em('Konvault\' Russian Roulette', '**Round ' + round + '**\n\n🔔  CLICK — Empty.\n\n<@' + player.id + '> survived... passing the gun.')] });
        await wait(1000);
      }
      round++;
    }
  },
};
