const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { em } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gamechannel')
    .setDescription('🎮  Owner: lock channel to 2 players only')
    .addUserOption(o => o.setName('player1').setDescription('First player').setRequired(true))
    .addUserOption(o => o.setName('player2').setDescription('Second player').setRequired(true)),

  async execute(interaction, client) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({ content: '🚫  Owner only.', ephemeral: true });
    }

    const p1 = interaction.options.getUser('player1');
    const p2 = interaction.options.getUser('player2');
    const channel = interaction.channel;
    const guild = interaction.guild;

    await interaction.deferReply();

    try {
      // Block @everyone from sending messages
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: false,
      });

      // Allow player 1
      await channel.permissionOverwrites.edit(p1.id, {
        SendMessages: true,
        ViewChannel: true,
      });

      // Allow player 2
      await channel.permissionOverwrites.edit(p2.id, {
        SendMessages: true,
        ViewChannel: true,
      });

      // Allow owner
      await channel.permissionOverwrites.edit(interaction.user.id, {
        SendMessages: true,
        ViewChannel: true,
      });

      // Allow the bot itself
      await channel.permissionOverwrites.edit(client.user.id, {
        SendMessages: true,
        ViewChannel: true,
        EmbedLinks: true,
      });

      await interaction.editReply({ embeds: [em('Konvert Flips\' Game Channel',
        '🎮  Channel locked to **2 players**\n\n' +
        '👤  <@' + p1.id + '>\n' +
        '👤  <@' + p2.id + '>\n\n' +
        'Everyone else can watch but not type.\n' +
        'Use `/endgame` to unlock the channel when done.'
      )] });

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '❌  Failed to lock channel. Make sure the bot has **Manage Channel** permissions.', ephemeral: true });
    }
  },
};
