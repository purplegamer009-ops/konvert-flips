const { SlashCommandBuilder } = require('discord.js');
const { em } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('endgame')
    .setDescription('🔓  Owner: unlock the channel back to everyone'),

  async execute(interaction, client) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({ content: '🚫  Owner only.', ephemeral: true });
    }

    const channel = interaction.channel;
    const guild = interaction.guild;

    await interaction.deferReply();

    try {
      // Restore @everyone send messages
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: null,
      });

      // Remove individual overrides — resets to default
      const overwritesToClear = channel.permissionOverwrites.cache.filter(
        o => o.id !== guild.roles.everyone.id && o.id !== client.user.id
      );

      for (const [id] of overwritesToClear) {
        await channel.permissionOverwrites.delete(id);
      }

      await interaction.editReply({ embeds: [em('Konvert Flips\' Game Channel',
        '🔓  Channel unlocked — everyone can type again.'
      )] });

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '❌  Failed to unlock. Make sure the bot has **Manage Channel** permissions.', ephemeral: true });
    }
  },
};
