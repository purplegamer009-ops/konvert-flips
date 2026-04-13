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
      return { total: t
