const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { wait, hmacRoll, IMAGES, PURPLE } = require('../utils/theme');
const { log } = require('../utils/logger');

const SUITS = ['♠️','♥️','♦️','♣️'];
const VALS  = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const RANKS = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 };

function drawCard() {
  return { v: VALS[hmacRoll(0,12)], s: SUITS[hmacRoll(0,3)] };
}
function cardStr(c) { return '**' + c.v + c.s + '**  *('+RANKS[c.v]+')*'; }

function gameEmbed(desc, imgKey) {
  return new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle('🃏  Card War')
    .setDescription(desc)
    .setThumbnail(IMAGES.logo)
    .setImage(IMAGES[imgKey] || IMAGES.highcard)
    .setTimestamp()
    .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cardwar')
    .setDescription('🃏  1v1 Card War — highest card wins, best of 3!')
    .addUserOption(o => o.setName('opponent').setDescription('Who to challenge?').setRequired(true)),

  async execute(interaction, client) {
    const opponent = interaction.options.getUser('opponent');
    if (opponent.id === interaction.user.id) return interaction.reply({ content: '🚫  Cannot play yourself.', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: '🚫  Cannot play a bot.', ephemeral: true });

    await interaction.reply({
      content: '<@' + opponent.id + '>',
      embeds: [gameEmbed(
        '<@' + interaction.user.id + '> challenged <@' + opponent.id + '> to **Card War!**\n\n' +
        '🃏  Both draw a card each round — highest wins\n' +
        '🔢  Cards ranked 2–A numerically\n' +
        '🏆  First to win **2 rounds** wins the match\n\n' +
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

    let wins1 = 0, wins2 = 0, round = 1;

    while (wins1 < 2 && wins2 < 2) {
      await interaction.channel.send({ embeds: [gameEmbed('**Round ' + round + '**\n\n🃏  Drawing cards...')] });
      await wait(1200);

      let c1 = drawCard(), c2 = drawCard();
      let roundLine = '';
      let tieCount = 0;

      // Handle ties — redraw
      while (RANKS[c1.v] === RANKS[c2.v]) {
        tieCount++;
        await interaction.channel.send({ embeds: [gameEmbed(
          '**Round ' + round + '**\n\n' +
          '<@' + interaction.user.id + '>  ' + cardStr(c1) + '\n' +
          '<@' + opponent.id + '>  ' + cardStr(c2) + '\n\n' +
          '⚖️  **TIE!** Redrawing...'
        )] });
        await wait(1200);
        c1 = drawCard(); c2 = drawCard();
      }

      const p1wins = RANKS[c1.v] > RANKS[c2.v];
      if (p1wins) wins1++; else wins2++;

      const winner = p1wins ? interaction.user : opponent;
      roundLine = '🏆  <@' + winner.id + '> wins this round!';

      await interaction.channel.send({ embeds: [new EmbedBuilder()
        .setColor(p1wins ? 0x00E676 : PURPLE)
        .setTitle('🃏  Card War  —  Round ' + round)
        .setDescription(
          '<@' + interaction.user.id + '>  ' + cardStr(c1) + '\n' +
          '<@' + opponent.id + '>  ' + cardStr(c2) + '\n\n' +
          roundLine + '\n\n' +
          '📊  Score:  <@' + interaction.user.id + '> **' + wins1 + '**  —  **' + wins2 + '** <@' + opponent.id + '>'
        )
        .setThumbnail(IMAGES.logo)
        .setTimestamp()
        .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
      ] });

      round++;
      if (wins1 < 2 && wins2 < 2) await wait(800);
    }

    const matchWinner = wins1 >= 2 ? interaction.user : opponent;
    const matchLoser  = wins1 >= 2 ? opponent : interaction.user;

    const resultMsg = await interaction.channel.send({ embeds: [new EmbedBuilder()
      .setColor(0x00E676)
      .setTitle('🃏  Card War — Result')
      .setDescription(
        '🏆  **<@' + matchWinner.id + '> wins the match!**\n\n' +
        '<@' + interaction.user.id + '>  **' + wins1 + '** wins\n' +
        '<@' + opponent.id + '>  **' + wins2 + '** wins'
      )
      .setImage(IMAGES.win)
      .setThumbnail(IMAGES.logo)
      .setTimestamp()
      .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
    ],
    components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rematch_cardwar_' + interaction.user.id + '_' + opponent.id).setLabel('🔁  Rematch').setStyle(ButtonStyle.Secondary)
    )]});

    await log(client, { user: matchWinner, game: '1v1 Card War', result: 'WIN', detail: matchWinner.username + ' won ' + Math.max(wins1,wins2) + '-' + Math.min(wins1,wins2) });

    // Rematch handler
    try {
      const btnCol = await resultMsg.awaitMessageComponent({
        filter: b => [interaction.user.id, opponent.id].includes(b.user.id) && b.customId.startsWith('rematch_cardwar_'),
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
        if (rAccepted) {
          await resultMsg.edit({ components: [] }).catch(() => {});
          return interaction.channel.send({ embeds: [gameEmbed('🔁  Rematch accepted! Use `/cardwar` to start.')] });
        } else {
          await resultMsg.edit({ components: [] }).catch(() => {});
        }
      } catch { await resultMsg.edit({ components: [] }).catch(() => {}); }
    } catch { await resultMsg.edit({ components: [] }).catch(() => {}); }
  },
};
