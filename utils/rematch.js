const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

async function addRematch(channel, resultMsg, user1, user2, commandName, client) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('rematch_' + commandName + '_' + user1.id + '_' + user2.id)
      .setLabel('🔁 Rematch')
      .setStyle(ButtonStyle.Secondary)
  );

  try { await resultMsg.edit({ components: [row] }); } catch { return; }

  try {
    const btnCol = await resultMsg.awaitMessageComponent({
      filter: b => [user1.id, user2.id].includes(b.user.id) && b.customId.startsWith('rematch_' + commandName),
      time: 30000,
    });

    const challenger = btnCol.user;
    const other = challenger.id === user1.id ? user2 : user1;

    await btnCol.reply({
      content: '<@' + other.id + '> — **' + challenger.displayName + '** wants a rematch! Type `accept` or `decline`'
    });

    await resultMsg.edit({ components: [] }).catch(() => {});

    try {
      const rCol = await channel.awaitMessages({
        filter: m => m.author.id === other.id && ['accept', 'decline'].includes(m.content.toLowerCase().trim()),
        max: 1, time: 20000, errors: ['time'],
      });
      const accepted = rCol.first().content.toLowerCase().trim() === 'accept';
      await rCol.first().delete().catch(() => {});

      if (!accepted) {
        await channel.send({ content: '❌ Rematch declined.' });
        return;
      }

      // Auto-run the same game with same players
      const cmd = client.commands.get(commandName);
      if (!cmd) return;

      // Build a fake interaction-like object to re-run the command
      // We send a setup message then call execute with a mock interaction
      await channel.send({ content: '🔁 Rematch accepted — starting now!' });

      // Create a pseudo-interaction pointing at the same channel
      const pseudo = buildPseudoInteraction(channel, challenger, other, commandName);
      await cmd.execute(pseudo, client);

    } catch {
      await channel.send({ content: '⏰ No response — rematch cancelled.' });
    }
  } catch {
    await resultMsg.edit({ components: [] }).catch(() => {});
  }
}

function buildPseudoInteraction(channel, challenger, opponent, commandName) {
  let replied = false;
  let deferred = false;

  const fakeReply = async function(opts) {
    replied = true;
    if (opts.content || opts.embeds || opts.components) {
      return channel.send(opts);
    }
  };

  return {
    user: challenger,
    channel,
    channelId: channel.id,
    guild: channel.guild,
    guildId: channel.guild?.id,
    replied: false,
    deferred: false,
    options: {
      getUser: function(name) {
        if (name === 'opponent') return opponent;
        return null;
      },
      getString: function() { return null; },
      getInteger: function() { return null; },
      getChannel: function() { return null; },
      getSubcommand: function() { return null; },
    },
    reply: fakeReply,
    editReply: async function(opts) { return channel.send(opts); },
    deferReply: async function() { deferred = true; },
    followUp: async function(opts) { return channel.send(opts); },
    fetchReply: async function() { return null; },
  };
}

module.exports = { addRematch };
