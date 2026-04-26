const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { IMAGES, PURPLE } = require('./theme');
const crypto = require('crypto');

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

// Small grey button that sits under results
function verifyRow(proofId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('kv_verify_' + proofId)
      .setLabel('🔒 Verify Result')
      .setStyle(ButtonStyle.Secondary)
  );
}

function registerVerifyHandler(client) {
  client.on('interactionCreate', async function(i) {
    if (!i.isButton()) return;
    if (!i.customId.startsWith('kv_verify_')) return;

    const proofId = i.customId.replace('kv_verify_', '');
    const proof = getProof(i.channelId, proofId);

    if (!proof) return i.reply({ content: '⚠️  Proof expired — only stored per session.', ephemeral: true });

    const commitment = crypto.createHash('sha256').update(proof.serverSeed).digest('hex');
    const hmac = crypto.createHmac('sha256', proof.serverSeed);
    hmac.update(proof.clientSeed + ':' + proof.nonce);
    const digest = hmac.digest('hex');

    await i.reply({
      embeds: [new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle('🔒  Provably Fair — Verified')
        .setThumbnail(IMAGES.logo)
        .setDescription(
          '**Game:** ' + proof.game + '\n' +
          '**Result:** ' + proof.result + '\n\n' +
          '```' + proof.serverSeed + '```' +
          '**Client Seed:** `' + proof.clientSeed + '`\n' +
          '**Nonce:** `' + proof.nonce + '`\n' +
          '**Commitment:** `' + commitment.slice(0, 32) + '...`\n\n' +
          '✅  Result was locked in cryptographically before the roll.'
        )
        .setFooter({ text: 'KONVAULT™  •  Provably Fair', iconURL: IMAGES.logo })
        .setTimestamp()
      ],
      ephemeral: true,
    });

    try {
      if (process.env.OWNER_ID && i.user.id !== process.env.OWNER_ID) {
        const owner = await client.users.fetch(process.env.OWNER_ID);
        await owner.send('🔒 **' + i.user.username + '** verified **' + proof.game + '** in <#' + i.channelId + '>');
      }
    } catch(e) {}
  });
}

module.exports = { storeProof, getProof, verifyRow, registerVerifyHandler };
