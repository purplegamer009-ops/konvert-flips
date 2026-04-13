const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { em, wait, rnd } = require('../utils/theme');
const { log } = require('../utils/logger');

const SUITS = ['♠️','♥️','♦️','♣️'];
const VALS  = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const card  = () => ({ s: SUITS[rnd(0,3)], v: VALS[rnd(0,12)] });
const cval  = v => ['J','Q','K'].includes(v) ? 10 : v==='A' ? 11 : parseInt(v);
const show  = h => h.map(c=>`${c.v}${c.s}`).join('  ');
function total(h) {
  let t = h.reduce((s,c)=>s+cval(c.v),0), a=h.filter(c=>c.v==='A').length;
  while(t>21&&a--) t-=10; return t;
}
const row = (d=false) => new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('bj_hit')  .setLabel('👊  Hit') .setStyle(ButtonStyle.Success).setDisabled(d),
  new ButtonBuilder().setCustomId('bj_stand').setLabel('✋  Stand').setStyle(ButtonStyle.Danger) .setDisabled(d),
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('🃏  Blackjack vs the dealer'),

  async execute(interaction, client) {
    await interaction.deferReply();
    let ph = [card(),card()], dh = [card(),card()];
    const pt = total(ph);

    if (pt===21) {
      await interaction.editReply({ embeds: [em('Konvert Flips\' Blackjack', `🃏  **${show(ph)}**\n\n🎉  **BLACKJACK!**`)] });
      return log(client, { user:interaction.user, game:'Blackjack', result:'BLACKJACK', detail:'Natural 21' });
    }

    const gameEmbed = () => em(
      'Konvert Flips\' Blackjack',
      `🃏  **Your hand:** ${show(ph)}  =  **${total(ph)}**\n🏠  **Dealer:** ${dh[0].v}${dh[0].s}  🂠`
    );

    await interaction.editReply({ embeds: [gameEmbed()], components: [row()] });
    const msg = await interaction.fetchReply();

    const col = msg.createMessageComponentCollector({
      filter: b => b.user.id === interaction.user.id,
      time: 60_000,
    });

    col.on('collect', async btn => {
      await btn.deferUpdate();
      if (btn.customId==='bj_hit') {
        ph.push(card());
        const t = total(ph);
        if (t>21) {
          col.stop();
          await msg.edit({ embeds: [em('Konvert Flips\' Blackjack', `🃏  **${show(ph)}**  =  **${t}**\n\n💥  **BUST**`)], components: [] });
          return log(client, { user:interaction.user, game:'Blackjack', result:'BUST', detail:`Hand: ${show(ph)}  Total: ${t}` });
        }
        if (t===21) { col.stop(); return resolve(msg, interaction, ph, dh, client); }
        await msg.edit({ embeds: [gameEmbed()], components: [row()] });
      }
      if (btn.customId==='bj_stand') { col.stop(); await resolve(msg, interaction, ph, dh, client); }
    });

    col.on('end', async (_,r) => {
      if (r==='time') await msg.edit({ embeds: [em('Konvert Flips\' Blackjack','⏰  Timed out')], components:[] }).catch(()=>{});
    });
  },
};

async function resolve(msg, interaction, ph, dh, client) {
  const rand = () => ({ s:['♠️','♥️','♦️','♣️'][Math.floor(Math.random()*4)], v:['2','3','4','5','6','7','8','9','10','J','Q','K','A'][Math.floor(Math.random()*13)] });
  while(total(dh)<17) dh.push(rand());
  const pt=total(ph), dt=total(dh), dbust=dt>21;
  let result, line;
  if (dbust||pt>dt) { result='WIN';  line=`✅  **${interaction.user.displayName}** wins!`; }
  else if (pt===dt) { result='TIE';  line=`🤝  Push — Tie`; }
  else              { result='LOSS'; line=`❌  Dealer wins`; }
  await msg.edit({ embeds: [em('Konvert Flips\' Blackjack',
    `🃏  **Your hand:** ${show(ph)}  =  **${pt}**\n🏠  **Dealer:** ${show(dh)}  =  **${dt}**${dbust?' 💥':''}\n\n${line}`
  )], components: [] });
  await log(client, { user:interaction.user, game:'Blackjack', result, detail:`Player: ${pt}  Dealer: ${dt}` });
}
