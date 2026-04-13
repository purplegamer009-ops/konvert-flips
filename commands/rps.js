const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { em, wait } = require('../utils/theme');
const { log } = require('../utils/logger');

const BEATS = { rock:'scissors', paper:'rock', scissors:'paper' };
const E = { rock:'🪨', paper:'📄', scissors:'✂️' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('✂️  1v1 Rock Paper Scissors — challenge another player!')
    .addUserOption(o => o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),

  async execute(interaction, client) {
    const opponent = interaction.options.getUser('opponent');
    if (opponent.id === interaction.user.id) return interaction.reply({ content: '🚫  You cannot play yourself.', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: '🚫  Cannot play against a bot.', ephemeral: true });

    await interaction.deferReply();

    // Challenge
    const challengeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rps_accept').setLabel('✅  Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('rps_decline').setLabel('❌  Decline').setStyle(ButtonStyle.Danger),
    );

    await interaction.editReply({
      embeds: [em('Konvert Flips\' RPS', `<@${interaction.user.id}> challenged <@${opponent.id}> to **1v1 Rock Paper Scissors!**\n\n<@${opponent.id}> — accept?`)],
      components: [challengeRow],
    });
    const msg = await interaction.fetchReply();

    const accepted = await new Promise(resolve => {
      const col = msg.createMessageComponentCollector({ filter: b => b.user.id === opponent.id, time: 30_000, max: 1 });
      col.on('collect', async btn => { await btn.deferUpdate(); resolve(btn.customId === 'rps_accept'); });
      col.on('end', (_, r) => { if (r === 'time') resolve(false); });
    });

    if (!accepted) return interaction.editReply({ embeds: [em('Konvert Flips\' RPS', `❌  <@${opponent.id}> declined.`)], components: [] });

    await interaction.editReply({ embeds: [em('Konvert Flips\' RPS', `🎮  Game on!\n\nBoth players — pick your move below!\nPicks are hidden until both choose.`)], components: [] });
    await wait(500);

    // Both players pick via DM-style ephemeral — but since we can't do that easily,
    // we send separate messages and collect both picks with hidden reveals
    const pickRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`rps_rock`).setLabel('🪨  Rock').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`rps_paper`).setLabel('📄  Paper').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`rps_scissors`).setLabel('✂️  Scissors').setStyle(ButtonStyle.Secondary),
    );

    const pickMsg = await interaction.channel.send({
      content: `<@${interaction.user.id}> <@${opponent.id}>`,
      embeds: [em('Konvert Flips\' RPS', `<@${interaction.user.id}> ❓\n<@${opponent.id}> ❓\n\nBoth pick your move — first come first serve!`)],
      components: [pickRow],
    });

    const picks = {};

    await new Promise(resolve => {
      const col = pickMsg.createMessageComponentCollector({
        filter: b => [interaction.user.id, opponent.id].includes(b.user.id),
        time: 30_000,
      });

      col.on('collect', async btn => {
        await btn.deferUpdate();
        if (picks[btn.user.id]) return; // already picked
        picks[btn.user.id] = btn.customId.replace('rps_', '');

        const p1picked = picks[interaction.user.id] ? '✅' : '❓';
        const p2picked = picks[opponent.id] ? '✅' : '❓';

        await pickMsg.edit({ embeds: [em('Konvert Flips\' RPS', `<@${interaction.user.id}> ${p1picked}\n<@${opponent.id}> ${p2picked}\n\nWaiting for both picks...`)], components: [pickRow] });

        if (Object.keys(picks).length === 2) col.stop('done');
      });

      col.on('end', () => resolve());
    });

    if (Object.keys(picks).length < 2) {
      return pickMsg.edit({ embeds: [em('Konvert Flips\' RPS', '⏰  Timed out — not everyone picked in time.')], components: [] });
    }

    const p1 = picks[interaction.user.id];
    const p2 = picks[opponent.id];

    await wait(500);

    let line, winner;
    if (p1 === p2) { line = `🤝  **TIE!**  Both picked ${E[p1]}`; }
    else if (BEATS[p1] === p2) { winner = interaction.user; line = `🏆  **<@${interaction.user.id}> wins!**  ${E[p1]} beats ${E[p2]}`; }
    else { winner = opponent; line = `🏆  **<@${opponent.id}> wins!**  ${E[p2]} beats ${E[p1]}`; }

    await pickMsg.edit({
      embeds: [em('Konvert Flips\' RPS  —  Result',
        `<@${interaction.user.id}>  ${E[p1]}  **${p1.toUpperCase()}**\n<@${opponent.id}>  ${E[p2]}  **${p2.toUpperCase()}**\n\n${line}`
      )],
      components: [],
    });

    await log(client, {
      user: winner ?? interaction.user,
      game: '1v1 RPS',
      result: winner ? 'WIN' : 'TIE',
      detail: `${interaction.user.username}: ${p1}  vs  ${opponent.username}: ${p2}`,
    });
  },
};
