const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { IMAGES, PURPLE } = require('../utils/theme');
module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('📖 All Konvault commands'),
  async execute(interaction){
    await interaction.reply({embeds:[new EmbedBuilder().setColor(PURPLE).setTitle('KONVAULT™  —  COMMANDS')
      .setDescription([
        '**Solo**','🎲 `/dice`  🚀 `/limbo`  🪙 `/coinflip`  🃏 `/highcard`','🎡 `/roulette`  🎟️ `/scratch`  🎰 `/slots`','',
        '**1v1**','✂️ `/rps`  🃏 `/blackjack`  📈 `/crash`  🔫 `/russian`','🔢 `/highlow`  🗼 `/tower`  🃏 `/cardwar`  🎲 `/diceduel`  🎯 `/snipe`','',
        '**Text**','`?dice` `?roll` `?cf` — quick rolls','`$BTC` `$ETH` `$SOL` etc — live price','',
        '**Wallet**','💰 `/balance`  `/setaddress`  💜 `/solbalance`  `/setsoladdress`  `/price`','',
        '**Stats**','📊 `/stats` — leaderboard  `/stats @user` — player stats','🔒 `/verify` — prove any result is fair','',
        '**Owner**','`/logresult`  `/lock`  `/unlock`  `/gamechannel`  `/endgame`',
      ].join('\n')).setThumbnail(IMAGES.logo).setFooter({text:'KONVAULT™',iconURL:IMAGES.logo})]});
  },
};
