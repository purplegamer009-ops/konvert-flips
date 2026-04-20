const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require(‘discord.js’);
const { IMAGES, PURPLE } = require(’./theme’);
const crypto = require(‘crypto’);

const proofStore = new Map();

function storeProof(channelId, proof) {
if (!proofStore.has(channelId)) proofStore.set(channelId, []);
const proofs = proofStore.get(channelId);
proofs.unshift(proof);
if (proofs.length > 50) proofs.pop();
return proof.id;
}

function getProof(channelId, proofId) {
const proofs = proofStore.get(channelId) || [];
return proofs.find(p => p.id === proofId);
}

// Small inline button
function verifyRow(proofId) {
return new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId(‘verify_’ + proofId)
.setLabel(‘🔒 Verify’)
.setStyle(ButtonStyle.Secondary)
);
}

function registerVerifyHandler(client) {
client.on(‘interactionCreate’, async i => {
if (!i.isButton()) return;
if (!i.customId.startsWith(‘verify_’)) return;

```
const proofId = i.customId.replace('verify_', '');
const proof = getProof(i.channelId, proofId);

if (!proof) {
  return i.reply({ content: '⚠️  Proof expired. Proofs are stored per session only.', ephemeral: true });
}

const commitment = crypto.createHash('sha256').update(proof.serverSeed).digest('hex');
const hmac = crypto.createHmac('sha256', proof.serverSeed);
hmac.update(`${proof.clientSeed}:${proof.nonce}`);
const digest = hmac.digest('hex');

const embed = new EmbedBuilder()
  .setColor(PURPLE)
  .setTitle('🔒  Provably Fair — Verified')
  .setThumbnail(IMAGES.logo)
  .setDescription([
    '**Game:** ' + proof.game,
    '**Result:** ' + proof.result,
    '**Player:** <@' + proof.userId + '>',
    '',
    '🔑  **Server Seed:**',
    '`' + proof.serverSeed + '`',
    '',
    '🌱  **Client Seed:** `' + proof.clientSeed + '`',
    '🔢  **Nonce:** `' + proof.nonce + '`',
    '',
    '🔒  **Commitment:**',
    '`' + commitment + '`',
    '',
    '✅  Result was locked in before it happened.',
  ].join('\n'))
  .setTimestamp()
  .setFooter({ text: 'KONVAULT™  •  Provably Fair', iconURL: IMAGES.logo });

// Only the clicker sees it
await i.reply({ embeds: [embed], ephemeral: true });

// DM the owner
try {
  const ownerId = process.env.OWNER_ID;
  if (ownerId && i.user.id !== ownerId) {
    const owner = await client.users.fetch(ownerId);
    await owner.send({
      embeds: [new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle('🔒  Verify Check Alert')
        .setDescription(
          '**' + i.user.username + '** (<@' + i.user.id + '>) just verified a result\n\n' +
          '**Game:** ' + proof.game + '\n' +
          '**Result:** ' + proof.result + '\n' +
          '**Channel:** <#' + i.channelId + '>'
        )
        .setTimestamp()
        .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
      ]
    });
  }
} catch {}
```

});
}

module.exports = { storeProof, getProof, verifyRow, registerVerifyHandler };
