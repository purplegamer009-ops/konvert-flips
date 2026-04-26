const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { PURPLE } = require('../utils/theme');

const LOGO = 'https://i.imgur.com/RKP25MI.png';

const EMBEDS = {
  terms: new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle('Terms of Service')
    .setThumbnail(LOGO)
    .setDescription([
      '**By participating in Konvault you agree:**',
      '',
      '▪ All flips are peer-to-peer agreements',
      '▪ Crypto transactions are final',
      '▪ Staff not responsible for losses without middleman',
      '▪ Scamming results in permanent blacklist',
      '▪ Users must verify wager before sending',
      '▪ Gambling involves risk, only flip what you can afford',
      '',
      'By using this server, you agree to these terms.',
    ].join('\n'))
    .setFooter({ text: 'KONVAULT™', iconURL: LOGO }),

  howto: new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle('How To Flip')
    .setThumbnail(LOGO)
    .setDescription([
      'Find a user in <#1491899432185364561>',
      '',
      '• Agree on amount and crypto',
      '• Open a ticket (recommended)',
      '• Send funds to middleman',
      '• Flip is conducted',
      '• Winner receives funds',
      '',
      '**Simple. Fast. Secure.**',
    ].join('\n'))
    .setFooter({ text: 'KONVAULT™', iconURL: LOGO }),

  middleman: new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle('Middleman Request')
    .setThumbnail(LOGO)
    .setDescription([
      'Once you\'re ready to open a MM ticket please click the button below.',
      'Please have the following information ready:',
      '',
      '• Your Flipper\'s ID / User (person you\'re flipping against)',
      '• The Flip Amount (e.g. $30 LTC vs $30 SOL)',
      '• OR Deal Info (if for MM & not to flip)',
      '',
      'Thank you!',
    ].join('\n'))
    .setFooter({ text: 'KONVAULT™', iconURL: LOGO }),

  rules: new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle('Server Rules')
    .setThumbnail(LOGO)
    .setDescription([
      '1. Be respectful to all members',
      '2. No scamming or attempting to scam',
      '3. No impersonation of staff or trusted users',
      '4. No advertising without permission',
      '5. Use middleman for all flips',
      '6. No spam or excessive messaging',
      '7. Follow Discord Terms of Service',
      '',
      '⎯',
      'Punishments may include:',
      'Warning, Mute, Kick, Ban.',
      '',
      'Staff decisions are final.',
    ].join('\n'))
    .setFooter({ text: 'KONVAULT™', iconURL: LOGO }),
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('post')
    .setDescription('📢 Owner: post a server embed')
    .addStringOption(o => o.setName('type').setDescription('Which embed to post').setRequired(true).addChoices(
      { name: '📜 Terms of Service', value: 'terms' },
      { name: '📖 How To Flip', value: 'howto' },
      { name: '🤝 Middleman Request', value: 'middleman' },
      { name: '📋 Server Rules', value: 'rules' },
    ))
    .addChannelOption(o => o.setName('channel').setDescription('Channel to post in (default: current)').setRequired(false)),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({ content: '🚫 Owner only.', ephemeral: true });
    }
    const type = interaction.options.getString('type');
    const channel = interaction.options.getChannel('channel') ?? interaction.channel;
    const embed = EMBEDS[type];
    if (!embed) return interaction.reply({ content: '❌ Unknown type.', ephemeral: true });
    await channel.send({ embeds: [embed] });
    await interaction.reply({ content: '✅ Posted to <#' + channel.id + '>', ephemeral: true });
  },
};
