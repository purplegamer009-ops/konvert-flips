const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');
module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('📖  All Konvault commands'),
  async execute(interaction) {
    await interaction.reply({ embeds: [em('KONVAULT™  —  COMMANDS', [
      '**Solo**',
      '🎲  `/dice` — Roll two dice',
      '🚀  `/limbo` — Random multiplier 1x–100x',
      '🪙  `/coinflip` — Heads or Tails',
      '🃏  `/highcard` — Draw a card',
      '🎡  `/roulette` — Spin the wheel',
      '🎟️  `/scratch` — Scratch a card',
      '🎰  `/slots` — Spin the slot machine',
      '',
      '**1v1**',
      '✂️  `/rps @user` — Rock Paper Scissors via DM',
      '🃏  `/blackjack @user` — Hit or Stand via DM',
      '📈  `/crash @user` — Secret cashout popup',
      '🔫  `/russian @user` — Russian Roulette',
      '🔢  `/highlow @user` — Higher or Lower',
      '',
      '**Wallet**',
      '💰  `/balance` — Check LTC wallet',
      '💜  `/solbalance` — Check SOL wallet',
      '',
      '**Owner**',
      '📋  `/logresult` — Manually log a result',
      '🔒  `/lock` — Disable games in channel',
      '🔓  `/unlock` — Re-enable games in channel',
      '🎮  `/gamechannel @p1 @p2` — Lock channel to 2 players',
      '🔓  `/endgame` — Unlock game channel',
    ].join('\n'))] });
  },
};
