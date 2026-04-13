const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { em, wait, rnd } = require('../utils/theme');
const { log } = require('../utils/logger');

const BEATS = { rock:'scissors', paper:'rock', scissors:'paper' };
const E = { rock:'🪨', paper:'📄', scissors:'✂️' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('✂️  Rock Paper Scissors vs the bot'),

  async execute(interaction, client) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rps_rock')    .setLabel('🪨  Rock')    .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('rps_paper')   .setLabel('📄  Paper')   .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('rps_scissors').setLabel('✂️  Scissors').setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({ embeds: [em('Konvert Flips\' RPS', '🎮  Pick your move')], components: [row] });
    const msg = await interaction.fetchReply();

    const col = msg.createMessageComponentCollector({
      filter: b => b.user.id === interaction.user.id,
      time: 30_000, max: 1,
    });

    col.on('collect', async btn => {
      await btn.deferUpdate();
      const player = btn.customId.replace('rps_','');
      const bot    = ['rock','paper','scissors'][rnd(0,2)];

      await msg.edit({ embeds: [em('Konvert Flips\' RPS', `${E[player]}  vs  🤔  Choosing...`)], components: [] });
      await wait(1000);

      let result;
      if (player === bot)          result = 'TIE';
      else if (BEATS[player]===bot) result = 'WIN';
      else                          result = 'LOSS';

      const line = result === 'WIN'  ? `✅  **${interaction.user.displayName}** wins!  ${E[player]} beats ${E[bot]}`
                 : result === 'LOSS' ? `❌  Bot wins!  ${E[bot]} beats ${E[player]}`
                 : `🤝  Tie!  ${E[player]} vs ${E[bot]}`;

      await msg.edit({ embeds: [em('Konvert Flips\' RPS', line)] });

      await log(client, {
        user: interaction.user,
        game: 'Rock Paper Scissors',
        result,
        detail: `Player: ${player}  •  Bot: ${bot}`,
      });
    });

    col.on('end', async (_, r) => {
      if (r==='time') await msg.edit({ embeds: [em('Konvert Flips\' RPS', '⏰  Timed out')], components: [] }).catch(()=>{});
    });
  },
};
