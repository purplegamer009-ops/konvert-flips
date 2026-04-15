const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('🔒  Owner: disable all bot games in this channel')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to lock (default: current)').setRequired(false)),

  async execute(interaction, client) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({ content: '🚫  Owner only.', ephemeral: true });
    }
    const target = interaction.options.getChannel('channel') ?? interaction.channel;
    client.blockedChannels.add(target.id);
    await interaction.reply({ embeds: [em('Konvert Flips\' Channel Lock', '🔒  Games disabled in <#' + target.id + '>\n\nUse `/unlock` to re-enable.')] });
  },
};
