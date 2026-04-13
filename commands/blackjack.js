const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

  const mkRow = (d=false) => new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`bj_hit_${userId}`).setLabel('👊  Hit').setStyle(ButtonStyle.Success).setDisabled(d),
    new ButtonBuilder().setCustomId(`bj_stand_${userId}`).setLabel('✋  Stand').setStyle(ButtonStyle.Danger).setDisabled(d),
  );

  const msg = await channel.send({
    embeds: [em('Konvert Flips\' Blackjack', `<@${userId}>'s turn\n🃏  **${show(hand)}**  =  **${total(hand)}**\n\nHit or Stand?`)],
    components: [mkRow()],
  });

  return new Promise(resolve => {
    const col = msg.createMessageComponentCollector({ filter: b => b.user.id === userId, time: 60_000 });
    col.on('collect', async btn => {
      await btn.deferUpdate();
      if (btn.customId === `bj_hit_${userId}`) {
        hand.push(card());
        const t = total(hand);
        if (t > 21) {
          col.stop();
          await msg.edit({ embeds: [em('Konvert Flips\' Blackjack', `<@${userId}>\n🃏  **${show(hand)}**  =  **${t}**\n\n💥  **BUST**`)], components: [mkRow(true)] });
          return resolve({ total: t, bust: true });
        }
        if (t === 21) {
          col.stop();
          await msg.edit({ embeds: [em('Konvert Flips\' Blackjack', `<@${userId}>\n🃏  **${show(hand)}**  =  **21**`)], components: [mkRow(true)] });
          return resolve({ total: 21 });
        }
        await msg.edit({ embeds: [em('Konvert Flips\' Blackjack', `<@${userId}>'s turn\n🃏  **${show(hand)}**  =  **${t}**\n\nHit or Stand?`)], components: [mkRow()] });
      }
      if (btn.customId === `bj_stand_${userId}`) {
        col.stop();
        await msg.edit({ embeds: [em('Konvert Flips\' Blackjack', `<@${userId}>\n🃏  **${show(hand)}**  =  **${total(hand)}**\n\n✋  Standing`)], components: [mkRow(true)] });
        resolve({ total: total(hand) });
      }
    });
    col.on('end', async (_, r) => {
      if (r === 'time') {
        await msg.edit({ embeds: [em('Konvert Flips\' Blackjack', `<@${userId}>\n⏰  Timed out — standing on **${total(hand)}**`)], components: [mkRow(true)] }).catch(()=>{});
        resolve({ total: total(hand) });
      }
    });
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('🃏  1v1 Blackjack — challenge another player!')
    .addUserOption(o => o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),

  async execute(interaction, client) {
    const opponent = interaction.options.getUser('opponent');
    if (opponent.id === interaction.user.id) return interaction.reply({ content: '🚫  You cannot play yourself.', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: '🚫  Cannot play against a bot.', ephemeral: true });

    await interaction.deferReply();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('bj_accept').setLabel('✅  Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('bj_decline').setLabel('❌  Decline').setStyle(ButtonStyle.Danger),
    );

    await interaction.editReply({
      embeds: [em('Konvert Flips\' Blackjack', `<@${interaction.user.id}> challenged <@${opponent.id}> to **1v1 Blackjack!**\n\n<@${opponent.id}> — accept or decline?`)],
      components: [row],
    });
    const msg = await interaction.fetchReply();

    const accepted = await new Promise(resolve => {
      const col = msg.createMessageComponentCollector({ filter: b => b.user.id === opponent.id, time: 30_000, max: 1 });
      col.on('collect', async btn => { await btn.deferUpdate(); resolve(btn.customId === 'bj_accept'); });
      col.on('end', (_, r) => { if (r === 'time') resolve(false); });
    });

    if (!accepted) return interaction.editReply({ embeds: [em('Konvert Flips\' Blackjack', `❌  <@${opponent.id}> declined.`)], components: [] });

    await interaction.editReply({ embeds: [em('Konvert Flips\' Blackjack', `🃏  Game on!\n\n<@${interaction.user.id}> goes first 👇`)], components: [] });
    await wait(800);

    const r1 = await playHand(interaction.channel, interaction.user.id);
    await wait(600);
    await interaction.channel.send({ embeds: [em('Konvert Flips\' Blackjack', `Now <@${opponent.id}>'s turn 👇`)] });
    await wait(500);
    const r2 = await playHand(interaction.channel, opponent.id);
    await wait(600);

    const t1 = r1.bust ? -1 : r1.total;
    const t2 = r2.bust ? -1 : r2.total;

    let line, winner;
    if (t1 === t2 || (r1.bust && r2.bust)) { line = '🤝  **TIE**'; }
    else if (t1 > t2) { winner = interaction.user; line = `🏆  **<@${interaction.user.id}> wins!**`; }
    else { winner = opponent; line = `🏆  **<@${opponent.id}> wins!**`; }

    await interaction.channel.send({ embeds: [em(
      'Konvert Flips\' Blackjack  —  Result',
      `<@${interaction.user.id}>  **${r1.bust ? 'BUST' : r1.total}**\n<@${opponent.id}>  **${r2.bust ? 'BUST' : r2.total}**\n\n${line}`
    )] });

    await log(client, {
      user: winner ?? interaction.user,
      game: '1v1 Blackjack',
      result: winner ? 'WIN' : 'TIE',
      detail: `${interaction.user.username}: ${r1.bust?'BUST':r1.total}  vs  ${opponent.username}: ${r2.bust?'BUST':r2.total}`,
    });
  },
};
