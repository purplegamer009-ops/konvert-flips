const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
    .setDescription('📈  1v1 Crash — both players set a cashout, same crash point!')
    .addUserOption(o => o.setName('opponent').setDescription('Who to challenge?').setRequired(true))
    .addNumberOption(o => o.setName('cashout').setDescription('Your cashout target (e.g. 2.5)').setRequired(true).setMinValue(1.01).setMaxValue(100)),

  async execute(interaction, client) {
    const opponent  = interaction.options.getUser('opponent');
    const myCashout = interaction.options.getNumber('cashout');

    if (opponent.id === interaction.user.id) return interaction.reply({ content: '🚫  You cannot play yourself.', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: '🚫  Cannot play against a bot.', ephemeral: true });

    await interaction.deferReply();

    // Challenge embed asking opponent for their cashout
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('crash_accept').setLabel('✅  Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('crash_decline').setLabel('❌  Decline').setStyle(ButtonStyle.Danger),
    );

    await interaction.editReply({
      embeds: [em('Konvert Flips\' Crash',
        `<@${interaction.user.id}> challenged <@${opponent.id}> to **1v1 Crash!**\n\n` +
        `<@${interaction.user.id}> set cashout: **${myCashout}x**\n` +
        `<@${opponent.id}> — accept to set your own cashout!`
      )],
      components: [row],
    });
    const msg = await interaction.fetchReply();

    const accepted = await new Promise(resolve => {
      const col = msg.createMessageComponentCollector({ filter: b => b.user.id === opponent.id, time: 30_000, max: 1 });
      col.on('collect', async btn => { await btn.deferUpdate(); resolve(btn.customId === 'crash_accept'); });
      col.on('end', (_, r) => { if (r === 'time') resolve(false); });
    });

    if (!accepted) return interaction.editReply({ embeds: [em('Konvert Flips\' Crash', `❌  <@${opponent.id}> declined.`)], components: [] });

    // Ask opponent for their cashout via follow-up
    await interaction.editReply({ embeds: [em('Konvert Flips\' Crash', `✅  <@${opponent.id}> accepted!\n\n<@${opponent.id}> — type your cashout target in chat (e.g. \`3.5\`)`)], components: [] });

    // Collect opponent's cashout from chat message
    let opponentCashout = null;
    try {
      const collected = await interaction.channel.awaitMessages({
        filter: m => m.author.id === opponent.id && !isNaN(parseFloat(m.content)) && parseFloat(m.content) >= 1.01 && parseFloat(m.content) <= 100,
        max: 1,
        time: 30_000,
        errors: ['time'],
      });
      opponentCashout = parseFloat(collected.first().content);
      await collected.first().delete().catch(() => {});
    } catch {
      return interaction.channel.send({ embeds: [em('Konvert Flips\' Crash', `⏰  <@${opponent.id}> didn't set a cashout in time. Game cancelled.`)] });
    }

    await interaction.channel.send({ embeds: [em('Konvert Flips\' Crash',
      `Both cashouts locked in!\n\n<@${interaction.user.id}>  **${myCashout}x**\n<@${opponent.id}>  **${opponentCashout}x**\n\n📈  Launching...`
    )] });
    await wait(2000);

    const cp = crashPoint();
    const p1survived = myCashout <= cp;
    const p2survived = opponentCashout <= cp;

    let line;
    if (p1survived && !p2survived)       line = `🏆  **<@${interaction.user.id}> wins!**  Cashed out at **${myCashout}x** before the crash!`;
    else if (!p1survived && p2survived)  line = `🏆  **<@${opponent.id}> wins!**  Cashed out at **${opponentCashout}x** before the crash!`;
    else if (p1survived && p2survived) {
      // Both survived — closest to crash point without going over wins
      const diff1 = cp - myCashout;
      const diff2 = cp - opponentCashout;
      if (diff1 < diff2)      line = `🏆  **<@${interaction.user.id}> wins!**  Both survived but **${myCashout}x** was closer to the crash!`;
      else if (diff2 < diff1) line = `🏆  **<@${opponent.id}> wins!**  Both survived but **${opponentCashout}x** was closer to the crash!`;
      else                    line = `🤝  **TIE!**  Both cashed out at the same target!`;
    } else {
      line = `💥  **Both busted!**  Neither cashout hit before **${cp}x** crash.`;
    }

    await interaction.channel.send({ embeds: [em(
      'Konvert Flips\' Crash  —  Result',
      `💥  Crashed at  **${cp}x**\n\n` +
      `<@${interaction.user.id}>  **${myCashout}x**  ${p1survived ? '✅' : '❌'}\n` +
      `<@${opponent.id}>  **${opponentCashout}x**  ${p2survived ? '✅' : '❌'}\n\n` +
      line
    )] });

    await log(client, {
      user: interaction.user,
      game: '1v1 Crash',
      result: p1survived && !p2survived ? 'WIN' : !p1survived && p2survived ? 'LOSS' : 'TIE',
      detail: `Crash: ${cp}x  •  ${interaction.user.username}: ${myCashout}x ${p1survived?'✅':'❌'}  •  ${opponent.username}: ${opponentCashout}x ${p2survived?'✅':'❌'}`,
    });
  },
};
