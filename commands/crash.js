const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { em, wait } = require('../utils/theme');
const { log } = require('../utils/logger');

function crashPoint() {
  const r = Math.random();
  if (r < 0.40) return +(Math.random() * 0.9 + 1.0).toFixed(2);
  if (r < 0.65) return +(Math.random() * 2   + 2  ).toFixed(2);
  if (r < 0.82) return +(Math.random() * 5   + 5  ).toFixed(2);
  if (r < 0.93) return +(Math.random() * 10  + 10 ).toFixed(2);
  if (r < 0.98) return +(Math.random() * 30  + 20 ).toFixed(2);
  return +(Math.random() * 50 + 50).toFixed(2);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crash')
    .setDescription('📈  1v1 Crash — both players set secret cashouts via popup!')
    .addUserOption(o => o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),

  async execute(interaction, client) {
    const opponent = interaction.options.getUser('opponent');
    if (opponent.id === interaction.user.id) return interaction.reply({ content: '🚫  You cannot play yourself.', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: '🚫  Cannot play against a bot.', ephemeral: true });

    // Step 1 — Challenge
    await interaction.reply({ embeds: [em('Konvert Flips\' Crash',
      '<@' + interaction.user.id + '> challenged <@' + opponent.id + '> to **1v1 Crash!**\n\n' +
      '<@' + opponent.id + '> — type `accept` or `decline` in chat'
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
      return interaction.channel.send({ embeds: [em('Konvert Flips\' Crash', '⏰  No response. Game cancelled.')] });
    }

    if (!accepted) return interaction.channel.send({ embeds: [em('Konvert Flips\' Crash', '❌  <@' + opponent.id + '> declined.')] });

    // Step 2 — Send modal to challenger via button
    const { ActionRowBuilder: AR2, ButtonBuilder, ButtonStyle } = require('discord.js');

    const p1row = new AR2().addComponents(
      new ButtonBuilder().setCustomId('crash_modal_p1').setLabel('📈  Set My Cashout').setStyle(ButtonStyle.Primary)
    );
    const p2row = new AR2().addComponents(
      new ButtonBuilder().setCustomId('crash_modal_p2').setLabel('📈  Set My Cashout').setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({ embeds: [em('Konvert Flips\' Crash',
      '✅  Game accepted!\n\nBoth players — click the button below to secretly enter your cashout target.\nNeither player will see the other\'s number until the crash!'
    )] });

    const msg1 = await interaction.channel.send({
      content: '<@' + interaction.user.id + '> — click to set your cashout:',
      components: [p1row]
    });

    const msg2 = await interaction.channel.send({
      content: '<@' + opponent.id + '> — click to set your cashout:',
      components: [p2row]
    });

    const picks = {};

    async function collectModal(msg, userId, customId) {
      return new Promise(resolve => {
        const timeout = setTimeout(() => resolve(null), 60000);
        const col = msg.createMessageComponentCollector({
          filter: b => b.user.id === userId && b.customId === customId,
          time: 60000,
          max: 1,
        });

        col.on('collect', async btn => {
          const modal = new ModalBuilder()
            .setCustomId('crash_input_' + userId)
            .setTitle('Set Your Cashout Target');

          const input = new TextInputBuilder()
            .setCustomId('cashout_value')
            .setLabel('Cashout multiplier (e.g. 2.5)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter a number between 1.01 and 100')
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder().addComponents(input));
          await btn.showModal(modal);

          try {
            const submitted = await btn.awaitModalSubmit({ time: 60000, filter: i => i.user.id === userId });
            const val = parseFloat(submitted.fields.getTextInputValue('cashout_value'));
            if (isNaN(val) || val < 1.01 || val > 100) {
              await submitted.reply({ content: '❌  Invalid number. Must be between 1.01 and 100.', ephemeral: true });
              clearTimeout(timeout);
              return resolve(null);
            }
            await submitted.reply({ content: '✅  Cashout of **' + val + 'x** locked in! Waiting for opponent...', ephemeral: true });
            clearTimeout(timeout);
            resolve(val);
          } catch {
            clearTimeout(timeout);
            resolve(null);
          }
        });

        col.on('end', (_, reason) => {
          if (reason === 'time') { clearTimeout(timeout); resolve(null); }
        });
      });
    }

    const [c1, c2] = await Promise.all([
      collectModal(msg1, interaction.user.id, 'crash_modal_p1'),
      collectModal(msg2, opponent.id, 'crash_modal_p2'),
    ]);

    await msg1.edit({ components: [] }).catch(() => {});
    await msg2.edit({ components: [] }).catch(() => {});

    if (!c1 || !c2) {
      return interaction.channel.send({ embeds: [em('Konvert Flips\' Crash', '⏰  Someone did not set a cashout in time. Game cancelled.')] });
    }

    // Step 3 — Launch
    await interaction.channel.send({ embeds: [em('Konvert Flips\' Crash',
      'Both cashouts locked in — launching!\n\n<@' + interaction.user.id + '>  **???x**\n<@' + opponent.id + '>  **???x**\n\n📈  Here we go...'
    )] });
    await wait(2000);

    const cp = crashPoint();
    const p1survived = c1 <= cp;
    const p2survived = c2 <= cp;

    let line, winner;
    if (p1survived && !p2survived) { winner = interaction.user; line = '🏆  <@' + interaction.user.id + '> wins!  Cashed out at **' + c1 + 'x** before the crash!'; }
    else if (!p1survived && p2survived) { winner = opponent; line = '🏆  <@' + opponent.id + '> wins!  Cashed out at **' + c2 + 'x** before the crash!'; }
    else if (p1survived && p2survived) {
      const diff1 = cp - c1, diff2 = cp - c2;
      if (diff1 < diff2) { winner = interaction.user; line = '🏆  <@' + interaction.user.id + '> wins!  Closer to the crash (**' + c1 + 'x** vs **' + c2 + 'x**)'; }
      else if (diff2 < diff1) { winner = opponent; line = '🏆  <@' + opponent.id + '> wins!  Closer to the crash (**' + c2 + 'x** vs **' + c1 + 'x**)'; }
      else { line = '🤝  TIE — identical cashouts!'; }
    } else {
      line = '💥  Both busted — nobody cashed out before **' + cp + 'x**!';
    }

    await interaction.channel.send({ embeds: [em('Konvert Flips\' Crash  —  Result',
      '💥  Crashed at  **' + cp + 'x**\n\n' +
      '<@' + interaction.user.id + '>  **' + c1 + 'x**  ' + (p1survived ? '✅' : '❌') + '\n' +
      '<@' + opponent.id + '>  **' + c2 + 'x**  ' + (p2survived ? '✅' : '❌') + '\n\n' +
      line
    )] });

    await log(client, {
      user: winner ?? interaction.user,
      game: '1v1 Crash',
      result: winner ? 'WIN' : 'TIE',
      detail: 'Crash: ' + cp + 'x  •  ' + interaction.user.username + ': ' + c1 + 'x ' + (p1survived?'✅':'❌') + '  •  ' + opponent.username + ': ' + c2 + 'x ' + (p2survived?'✅':'❌'),
    });
  },
};
