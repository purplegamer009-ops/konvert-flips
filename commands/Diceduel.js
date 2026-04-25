const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { wait, hmacRoll, IMAGES, PURPLE } = require('../utils/theme');
const { log } = require('../utils/logger');

function gameEmbed(desc, color, imgKey) {
  return new EmbedBuilder()
    .setColor(color || PURPLE)
    .setTitle('🎲  Dice Duel')
    .setDescription(desc)
    .setThumbnail(IMAGES.logo)
    .setImage(IMAGES[imgKey] || IMAGES.dice)
    .setTimestamp()
    .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('diceduel')
    .setDescription('🎲  1v1 Dice Duel — predict over or under 7, one roll decides!')
    .addUserOption(o => o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),

  async execute(interaction, client) {
    const opponent = interaction.options.getUser('opponent');
    if (opponent.id === interaction.user.id) return interaction.reply({ content: '🚫  Cannot play yourself.', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: '🚫  Cannot play a bot.', ephemeral: true });

    await interaction.reply({
      content: '<@' + opponent.id + '>',
      embeds: [gameEmbed(
        '<@' + interaction.user.id + '> challenged <@' + opponent.id + '> to **Dice Duel!**\n\n' +
        '🎲  Both secretly pick **Over 7** or **Under 7**\n' +
        '🎯  One roll of two dice decides both\n' +
        '⚡  Whoever called it right wins\n\n' +
        '<@' + opponent.id + '> — type `accept` or `decline`'
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
    } catch { return interaction.channel.send({ embeds: [gameEmbed('⏰  No response. Cancelled.')] }); }

    if (!accepted) return interaction.channel.send({ embeds: [gameEmbed('❌  <@' + opponent.id + '> declined.')] });

    await interaction.channel.send({ embeds: [gameEmbed('✅  Accepted!\n\nBoth players — click your button to secretly pick your prediction.')] });

    const p1row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('dd_p1_' + interaction.user.id).setLabel('🎲  Pick Over or Under').setStyle(ButtonStyle.Primary)
    );
    const p2row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('dd_p2_' + opponent.id).setLabel('🎲  Pick Over or Under').setStyle(ButtonStyle.Primary)
    );

    const msg1 = await interaction.channel.send({ content: '<@' + interaction.user.id + '> — click to pick:', components: [p1row] });
    const msg2 = await interaction.channel.send({ content: '<@' + opponent.id + '> — click to pick:', components: [p2row] });

    async function collectPick(msg, userId, customId) {
      return new Promise(resolve => {
        const timeout = setTimeout(() => resolve(null), 60000);
        const col = msg.createMessageComponentCollector({ filter: b => b.user.id === userId && b.customId === customId, time: 60000, max: 1 });
        col.on('collect', async btn => {
          const modal = new ModalBuilder().setCustomId('dd_modal_' + userId).setTitle('Your Prediction');
          const input = new TextInputBuilder()
            .setCustomId('dd_pick')
            .setLabel('Type "over" or "under"')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('over / under')
            .setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          await btn.showModal(modal);
          try {
            const sub = await btn.awaitModalSubmit({ time: 60000, filter: i => i.user.id === userId });
            const val = sub.fields.getTextInputValue('dd_pick').toLowerCase().trim();
            if (!['over','under'].includes(val)) {
              await sub.reply({ content: '❌  Type exactly `over` or `under`', ephemeral: true });
              clearTimeout(timeout); return resolve(null);
            }
            await sub.reply({ content: '✅  **' + val.toUpperCase() + '** locked in! Waiting...', ephemeral: true });
            clearTimeout(timeout); resolve(val);
          } catch { clearTimeout(timeout); resolve(null); }
        });
        col.on('end', (_, r) => { if (r === 'time') { clearTimeout(timeout); resolve(null); } });
      });
    }

    const [pick1, pick2] = await Promise.all([
      collectPick(msg1, interaction.user.id, 'dd_p1_' + interaction.user.id),
      collectPick(msg2, opponent.id, 'dd_p2_' + opponent.id),
    ]);

    await msg1.edit({ components: [] }).catch(() => {});
    await msg2.edit({ components: [] }).catch(() => {});

    if (!pick1 || !pick2) return interaction.channel.send({ embeds: [gameEmbed('⏰  Someone timed out. Cancelled.')] });

    await interaction.channel.send({ embeds: [gameEmbed('Both locked in!\n\n🎲  Rolling the dice...', PURPLE, 'dice')] });
    await wait(1500);

    const d1 = hmacRoll(1, 6), d2 = hmacRoll(1, 6);
    const total = d1 + d2;
    const result = total > 7 ? 'over' : total < 7 ? 'under' : 'seven';

    const p1correct = pick1 === result;
    const p2correct = pick2 === result;

    let line, winner;
    if (result === 'seven') {
      line = '⚖️  **Exactly 7 — everyone loses!**';
    } else if (p1correct && !p2correct) {
      winner = interaction.user;
      line = '🏆  **<@' + interaction.user.id + '> wins!** Called **' + pick1.toUpperCase() + '** correctly!';
    } else if (!p1correct && p2correct) {
      winner = opponent;
      line = '🏆  **<@' + opponent.id + '> wins!** Called **' + pick2.toUpperCase() + '** correctly!';
    } else if (p1correct && p2correct) {
      line = '🤝  **TIE!** Both called it right!';
    } else {
      line = '💀  **Both wrong!** Nobody called it!';
    }

    const resultMsg = await interaction.channel.send({ embeds: [new EmbedBuilder()
      .setColor(winner ? 0x00E676 : PURPLE)
      .setTitle('🎲  Dice Duel — Result')
      .setDescription(
        '🎲  Rolled **' + d1 + '** + **' + d2 + '** = **' + total + '**  ' + (total > 7 ? '📈 OVER' : total < 7 ? '📉 UNDER' : '⚖️ SEVEN') + '\n\n' +
        '<@' + interaction.user.id + '>  picked **' + pick1.toUpperCase() + '**  ' + (p1correct ? '✅' : '❌') + '\n' +
        '<@' + opponent.id + '>  picked **' + pick2.toUpperCase() + '**  ' + (p2correct ? '✅' : '❌') + '\n\n' +
        line
      )
      .setImage(winner ? IMAGES.win : IMAGES.dice)
      .setThumbnail(IMAGES.logo)
      .setTimestamp()
      .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
    ],
    components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rematch_diceduel_' + interaction.user.id + '_' + opponent.id).setLabel('🔁  Rematch').setStyle(ButtonStyle.Secondary)
    )]});

    await log(client, { user: winner || interaction.user, game: '1v1 Dice Duel', result: winner ? 'WIN' : 'TIE', detail: 'Roll: ' + total + ' (' + (total>7?'OVER':total<7?'UNDER':'SEVEN') + ')  —  ' + interaction.user.username + ': ' + pick1 + '  vs  ' + opponent.username + ': ' + pick2 });

    try {
      const btnCol = await resultMsg.awaitMessageComponent({
        filter: b => [interaction.user.id, opponent.id].includes(b.user.id) && b.customId.startsWith('rematch_diceduel_'),
        time: 30000
      });
      const challenger = btnCol.user;
      const other = challenger.id === interaction.user.id ? opponent : interaction.user;
      await btnCol.reply({ content: '<@' + other.id + '> — **' + challenger.username + '** wants a rematch! Type `accept` or `decline`' });
      try {
        const rCol = await interaction.channel.awaitMessages({
          filter: m => m.author.id === other.id && ['accept','decline'].includes(m.content.toLowerCase().trim()),
          max: 1, time: 20000, errors: ['time']
        });
        const rAccepted = rCol.first().content.toLowerCase().trim() === 'accept';
        await rCol.first().delete().catch(() => {});
        await resultMsg.edit({ components: [] }).catch(() => {});
        if (rAccepted) return interaction.channel.send({ embeds: [gameEmbed('🔁  Rematch accepted! Use `/diceduel` to start.')] });
      } catch { await resultMsg.edit({ components: [] }).catch(() => {}); }
    } catch { await resultMsg.edit({ components: [] }).catch(() => {}); }
  },
};
