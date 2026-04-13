const { SlashCommandBuilder } = require('discord.js');
const { em, wait, rnd } = require('../utils/theme');
const { log } = require('../utils/logger');

const SUITS = ['♠️','♥️','♦️','♣️'];
const VALS  = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const card  = () => ({ s: SUITS[rnd(0,3)], v: VALS[rnd(0,12)] });
const cval  = v => ['J','Q','K'].includes(v) ? 10 : v==='A' ? 11 : parseInt(v);
const show  = h => h.map(c=>`${c.v}${c.s}`).join(' ');
function total(h) {
  let t = h.reduce((s,c)=>s+cval(c.v),0), a=h.filter(c=>c.v==='A').length;
  while(t>21&&a--) t-=10; return t;
}

async function playHand(channel, userId) {
  let hand = [card(), card()];
  if (total(hand) === 21) {
    await channel.send({ embeds: [em('Konvert Flips\' Blackjack', `<@${userId}>\n🃏  **${show(hand)}**\n\n🎉  **BLACKJACK!**`)] });
    return { total: 21, blackjack: true };
  }
  await channel.send({ embeds: [em('Konvert Flips\' Blackjack',
    `<@${userId}>'s turn\n🃏  **${show(hand)}**  =  **${total(hand)}**\n\nType \`hit\` or \`stand\` in chat`
  )] });
  while (true) {
    let move;
    try {
      const collected = await channel.awaitMessages({
        filter: m => m.author.id === userId && ['hit','stand'].includes(m.content.toLowerCase().trim()),
        max: 1, time: 60_000, errors: ['time'],
      });
      move = collected.first().content.toLowerCase().trim();
      await collected.first().delete().catch(() => {});
    } catch {
      await channel.send({ embeds: [em('Konvert Flips\' Blackjack', `⏰  <@${userId}> timed out — standing on **${total(hand)}**`)] });
      return { total: total(hand) };
    }
    if (move === 'stand') {
      await channel.send({ embeds: [em('Konvert Flips\' Blackjack', `<@${userId}>\n🃏  **${show(hand)}**  =  **${total(hand)}**\n\n✋  Standing`)] });
      return { total: total(hand) };
    }
    hand.push(card());
    const t = total(hand);
    if (t > 21) {
      await channel.send({ embeds: [em('Konvert Flips\' Blackjack', `<@${userId}>\n🃏  **${show(hand)}**  =  **${t}**\n\n💥  **BUST**`)] });
      return { total: t, bust: true };
    }
    if (t === 21) {
      await channel.send({ embeds: [em('Konvert Flips\' Blackjack', `<@${userId}>\n🃏  **${show(hand)}**  =  **21**\n\n✅  Standing on 21`)] });
      return { total: 21 };
    }
    await channel.send({ embeds: [em('Konvert Flips\' Blackjack',
      `<@${userId}>'s turn\n🃏  **${show(hand)}**  =  **${t}**\n\nType \`hit\` or \`stand\``
    )] });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('🃏  1v1 Blackjack — type hit or stand!')
    .addUserOption(o => o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),

  async execute(interaction, client) {
    const opponent = interaction.options.getUser('opponent');
    if (opponent.id === interaction.user.id) return interaction.reply({ content: '🚫  You cannot play yourself.', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: '🚫  Cannot play against a bot.', ephemeral: true });

    await interaction.deferReply();
    await interaction.editReply({ embeds: [em('Konvert Flips\' Blackjack',
      `<@${interaction.user.id}> challenged <@${opponent.id}> to **1v1 Blackjack!**\n\n<@${opponent.id}> — type \`accept\` or \`decline\` in chat`
    )] });

    let accepted = false;
    try {
      const collected = await interaction.channel.awaitMessages({
        filter: m => m.author.id === opponent.id && ['accept','decline'].includes(m.content.toLowerCase().trim()),
        max: 1, time: 30_000, errors: ['time'],
      });
      accepted = collected.first().content.toLowerCase().trim() === 'accept';
      await collected.first().delete().catch(() => {});
    } catch {
      return interaction.editReply({ embeds: [em('Konvert Flips\' Blackjack', `⏰  <@${opponent.id}> didn't respond. Cancelled.`)] });
    }

    if (!accepted) return interaction.editReply({ embeds: [em('Konvert Flips\' Blackjack', `❌  <@${opponent.id}> declined.`)] });

    await interaction.editReply({ embeds: [em('Konvert Flips\' Blackjack', `🃏  Game on!\n\n<@${interaction.user.id}> goes first — type \`hit\` or \`stand\` in chat`)] });
    await wait(800);

    const r1 = await playHand(interaction.channel, interaction.user.id);
    await wait(600);
    await interaction.channel.send({ embeds: [em('Konvert Flips\' Blackjack', `Now <@${opponent.id}>'s turn — type \`hit\` or \`stand\``)] });
    await wait(500);
    const r2 = await playHand(interaction.channel, opponent.id);
    await wait(600);

    const t1 = r1.bust ? -1 : r1.total;
    const t2 = r2.bust ? -1 : r2.total;
    let line, winner;
    if (t1 === t2 || (r1.bust && r2.bust)) { line = '🤝  **TIE**'; }
    else if (t1 > t2) { winner = interaction.user; line = `🏆  **<@${interaction.user.id}> wins!**`; }
    else { winner = opponent; line = `🏆  **<@${opponent.id}> wins!**`; }

    await interaction.channel.send({ embeds: [em('Konvert Flips\' Blackjack  —  Result',
      `<@${interaction.user.id}>  **${r1.bust ? 'BUST' : r1.total}**\n<@${opponent.id}>  **${r2.bust ? 'BUST' : r2.total}**\n\n${line}`
    )] });

    await log(client, { user: winner ?? interaction.user, game: '1v1 Blackjack', result: winner ? 'WIN' : 'TIE',
      detail: `${interaction.user.username}: ${r1.bust?'BUST':r1.total}  vs  ${opponent.username}: ${r2.bust?'BUST':r2.total}` });
  },
};
