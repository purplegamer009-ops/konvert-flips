const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');
module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('📖  All Konvault commands'),
  async execute(interaction){
    await interaction.reply({embeds:[em('KONVAULT™  —  COMMANDS',[
      '**Solo**','🎲  `/dice`','🚀  `/limbo`','🪙  `/coinflip`','🃏  `/highcard`','🎡  `/roulette`','🎟️  `/scratch`','🎰  `/slots`','',
      '**1v1**','✂️  `/rps @user`','🃏  `/blackjack @user`','📈  `/crash @user`','🔫  `/russian @user`','🔢  `/highlow @user`','🗼  `/tower @user`','',
      '**Text Commands**','`?dice` `?roll` — Quick dice','`?cf` — Quick coinflip','`$BTC` `$ETH` `$SOL` etc — Live price','',
      '**Wallet**','💰  `/balance`  `/setaddress`','💜  `/solbalance`  `/setsoladdress`','💰  `/price` — Any crypto price','',
      '**Trust**','🔒  `/verify` — Prove any result is fair','',
      '**Owner**','📋  `/logresult`','🔒  `/lock` `/unlock`','🎮  `/gamechannel @p1 @p2`','🔓  `/endgame`',
    ].join('\n'))]});
  },
};
