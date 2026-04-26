const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require(‘discord.js’);

async function addRematch(channel, resultMsg, user1, user2, commandName) {
const row = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId(‘rematch_’ + commandName + ‘*’ + user1.id + ’*’ + user2.id).setLabel(‘🔁 Rematch’).setStyle(ButtonStyle.Secondary)
);
try { await resultMsg.edit({ components: [row] }); } catch(e) { return; }
try {
const btnCol = await resultMsg.awaitMessageComponent({
filter: function(b) { return [user1.id, user2.id].includes(b.user.id) && b.customId.startsWith(‘rematch_’ + commandName); },
time: 30000
});
const challenger = btnCol.user;
const other = challenger.id === user1.id ? user2 : user1;
await btnCol.reply({ content: ‘<@’ + other.id + ‘> — **’ + challenger.username + ’** wants a rematch! Type `accept` or `decline`’ });
const rCol = await channel.awaitMessages({
filter: function(m) { return m.author.id === other.id && [‘accept’,‘decline’].includes(m.content.toLowerCase().trim()); },
max: 1, time: 20000, errors: [‘time’]
});
const accepted = rCol.first().content.toLowerCase().trim() === ‘accept’;
await rCol.first().delete().catch(function() {});
await resultMsg.edit({ components: [] }).catch(function() {});
if (accepted) await channel.send({ content: ‘🔁 Rematch accepted! Use `/' + commandName + '` to run it back.’ });
} catch(e) { await resultMsg.edit({ components: [] }).catch(function() {}); }
}

module.exports = { addRematch };
