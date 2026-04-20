const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { em, wait, hmacRoll, secureShuffle } = require('../utils/theme');
const { storeProof, verifyRow } = require('../utils/verifyButton');
const { log } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('🎯  1v1 Snipe — both pick a number 1-100, closest to the target wins!')
    .addUserOption(o => o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),

  async execute(interaction, client) {
    const opponent = interaction.options.getUser('opponent');
    if (opponent.id === interaction.user.id) return interaction.reply({ content: '🚫  You cannot play yourself.', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: '🚫  Cannot play against a bot.', ephemeral: true });

    await interaction.reply({
      content: `<@${opponent.id}>`,
      embeds: [em('Konvault\' Snipe',
        '<@' + interaction.user.id + '> challenged <@' + opponent.id + '> to **1v1 Snipe!**\n\n' +
        '🎯  Both players secretly pick a number **1–100**\n' +
        'A random target is generated — whoever is closest **without going over** wins\n' +
        'If both go over, closest to target wins\n\n' +
        '<@' + opponent.id + '> — type `accept` or `decline`',
        null, 'verify'
      )]
    });

    let accepted = false;
    try {
      const col = await interaction.channel.awaitMessages({
        filter: m => m.author.id === opponent.id && ['accept','decline'].includes(m.content.toLowerCase().trim()),
        max: 1, time: 30000, errors: ['time']
      });
      accepted = col.first().content.toLowerCase().trim() === 'accept';
      await col.first().delete().catch(() => {});
    } catch {
      return interaction.channel.send({ embeds: [em('Konvault\' Snipe', '⏰  No response. Game cancelled.')] });
    }

    if (!accepted) return interaction.channel.send({ embeds: [em('Konvault\' Snipe', '❌  <@' + opponent.id + '> declined.')] });

    await interaction.channel.send({ embeds: [em('Konvault\' Snipe',
      '✅  Game accepted!\n\nBoth players — click your button to secretly enter your number.'
    )] });

    const { ActionRowBuilder: AR, ButtonBuilder, ButtonStyle } = require('discord.js');
    const p1row = new AR().addComponents(new ButtonBuilder().setCustomId('snipe_p1').setLabel('🎯  Enter Your Number').setStyle(ButtonStyle.Primary));
    const p2row = new AR().addComponents(new ButtonBuilder().setCustomId('snipe_p2').setLabel('🎯  Enter Your Number').setStyle(ButtonStyle.Primary));

    const msg1 = await interaction.channel.send({ content: '<@' + interaction.user.id + '> — click to enter your number:', components: [p1row] });
    const msg2 = await interaction.channel.send({ content: '<@' + opponent.id + '> — click to enter your number:', components: [p2row] });

    async function collectPick(msg, userId, customId) {
      return new Promise(resolve => {
        const timeout = setTimeout(() => resolve(null), 60000);
        const col = msg.createMessageComponentCollector({ filter: b => b.user.id === userId && b.customId === customId, time: 60000, max: 1 });
        col.on('collect', async btn => {
          const modal = new ModalBuilder().setCustomId('snipe_input_' + userId).setTitle('Enter Your Number');
          const input = new TextInputBuilder().setCustomId('snipe_value').setLabel('Pick a number between 1 and 100').setStyle(TextInputStyle.Short).setPlaceholder('e.g. 73').setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          await btn.showModal(modal);
          try {
            const submitted = await btn.awaitModalSubmit({ time: 60000, filter: i => i.user.id === userId });
            const val = parseInt(submitted.fields.getTextInputValue('snipe_value'));
            if (isNaN(val) || val < 1 || val > 100) {
              await submitted.reply({ content: '❌  Must be between 1 and 100.', ephemeral: true });
              clearTimeout(timeout); return resolve(null);
            }
            await submitted.reply({ content: '✅  **' + val + '** locked in! Waiting for opponent...', ephemeral: true });
            clearTimeout(timeout); resolve(val);
          } catch { clearTimeout(timeout); resolve(null); }
        });
        col.on('end', (_, r) => { if (r === 'time') { clearTimeout(timeout); resolve(null); } });
      });
    }

    const [pick1, pick2] = await Promise.all([
      collectPick(msg1, interaction.user.id, 'snipe_p1'),
      collectPick(msg2, opponent.id, 'snipe_p2'),
    ]);

    await msg1.edit({ components: [] }).catch(() => {});
    await msg2.edit({ components: [] }).catch(() => {});

    if (!pick1 || !pick2) return interaction.channel.send({ embeds: [em('Konvault\' Snipe', '⏰  Someone did not pick in time. Game cancelled.')] });

    await interaction.channel.send({ embeds: [em('Konvault\' Snipe', 'Both locked in!\n\n🎯  Generating target...', null, 'verify')] });
    await wait(1500);

    // Generate provably fair target
    const { generateFairRoll } = require('../utils/theme');
    const fairRoll = generateFairRoll(1, 100);
    const target = fairRoll.result;

    const diff1 = target - pick1;
    const diff2 = target - pick2;
    const over1 = pick1 > target;
    const over2 = pick2 > target;

    let line, winner;

    if (!over1 && !over2) {
      // Both under — closest wins
      if (diff1 < diff2) { winner = interaction.user; line = '🏆  **<@' + interaction.user.id + '> wins!**  Closer without going over (**' + pick1 + '** vs **' + pick2 + '**)'; }
      else if (diff2 < diff1) { winner = opponent; line = '🏆  **<@' + opponent.id + '> wins!**  Closer without going over (**' + pick2 + '** vs **' + pick1 + '**)'; }
      else { line = '🤝  **TIE!**  Both picked **' + pick1 + '**'; }
    } else if (over1 && !over2) {
      winner = opponent; line = '🏆  **<@' + opponent.id + '> wins!**  <@' + interaction.user.id + '> went over the target!';
    } else if (over2 && !over1) {
      winner = interaction.user; line = '🏆  **<@' + interaction.user.id + '> wins!**  <@' + opponent.id + '> went over the target!';
    } else {
      // Both over — closest to target wins
      const absDiff1 = Math.abs(pick1 - target);
      const absDiff2 = Math.abs(pick2 - target);
      if (absDiff1 < absDiff2) { winner = interaction.user; line = '🏆  **<@' + interaction.user.id + '> wins!**  Both over but closer (**' + pick1 + '** vs **' + pick2 + '**)'; }
      else if (absDiff2 < absDiff1) { winner = opponent; line = '🏆  **<@' + opponent.id + '> wins!**  Both over but closer (**' + pick2 + '** vs **' + pick1 + '**)'; }
      else { line = '🤝  **TIE!**  Both equally close'; }
    }

    const proofId = storeProof(interaction.channelId, {
      id: Date.now() + '_snipe',
      game: 'Snipe',
      result: 'Target: ' + target + ' — ' + interaction.user.username + ': ' + pick1 + '  vs  ' + opponent.username + ': ' + pick2,
      userId: interaction.user.id,
      serverSeed: fairRoll.serverSeed,
      clientSeed: fairRoll.clientSeed,
      nonce: fairRoll.nonce,
    });

    await interaction.channel.send({
      embeds: [em('Konvault\' Snipe — Result',
        '🎯  Target was **' + target + '**\n\n' +
        '<@' + interaction.user.id + '>  picked **' + pick1 + '**  ' + (over1 ? '❌ over' : '✅') + '\n' +
        '<@' + opponent.id + '>  picked **' + pick2 + '**  ' + (over2 ? '❌ over' : '✅') + '\n\n' +
        line,
        null, winner ? 'win' : 'loss'
      )],
      components: [verifyRow(proofId)],
    });

    await log(client, {
      user: winner ?? interaction.user,
      game: '1v1 Snipe',
      result: winner ? 'WIN' : 'TIE',
      detail: 'Target: ' + target + ' — ' + interaction.user.username + ': ' + pick1 + '  vs  ' + opponent.username + ': ' + pick2,
    });
  },
};
