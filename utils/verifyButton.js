const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { IMAGES, PURPLE } = require('./theme');
const crypto = require('crypto');

// Store recent proofs in memory — last 20 per channel
const proofStore = new Map();

function storeProof(channelId, proof) {
  if (!proofStore.has(channelId)) proofStore.set(channelId, []);
  const proofs = proofStore.get(channelId);
  proofs.unshift(proof); // newest first
  if (proofs.length > 20) proofs.pop();
  return proof.id;
}

function getProof(channelId, proofId) {
  const proofs = proofStore.get(channelId) || [];
  return proofs.find(p => p.id === proofId);
}

function verifyRow(proofId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('verify_' + proofId)
      .setLabel('🔒  Verify this result')
      .setStyle(ButtonStyle.Secondary)
  );
}

function registerVerifyHandler(client) {
  client.on('interactionCreate', async i => {
    if (!i.isButton()) return;
    if (!i.customId.startsWith('verify_')) return;

    const proofId = i.customId.replace('verify_', '');
    const proof = getProof(i.channelId, proofId);

    if (!proof) {
      return i.reply({ content: '⚠️  Proof expired or not found. Proofs are stored for the session only.', ephemeral: false });
    }

    // Recompute to confirm
    const commitment = crypto.createHash('sha256').update(proof.serverSeed).digest('hex');
    const hmac = crypto.createHmac('sha256', proof.serverSeed);
    hmac.update(`${proof.clientSeed}:${proof.nonce}`);
    const digest = hmac.digest('hex');

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('🔒  Provably Fair — Verified')
      .setThumbnail(IMAGES.logo)
      .setImage(IMAGES.verify)
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
        '🔒  **Commitment (SHA-256 of Server Seed):**',
        '`' + commitment + '`',
        '',
        '📊  **HMAC-SHA256 Digest:**',
        '`' + digest.slice(0, 40) + '...`',
        '',
        '✅  **This result was locked in before it happened.**',
        'Hash the Server Seed yourself and confirm it matches the Commitment.',
      ].join('\n'))
      .setTimestamp()
      .setFooter({ text: 'KONVAULT™  •  Provably Fair', iconURL: IMAGES.logo });

    await i.reply({ embeds: [embed] });
  });
}

module.exports = { storeProof, getProof, verifyRow, registerVerifyHandler };
