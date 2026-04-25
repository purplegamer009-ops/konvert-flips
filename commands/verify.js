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
  return proofs.find(function(p) { return p.id === proofId; });
}

// Tiny secondary button
function verifyRow(proofId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('verify_' + proofId)
      .setLabel('🔒 verify')
      .setStyle(ButtonStyle.Secondary)
  );
}

function registerVerifyHandler(client) {
  client.on('interactionCreate', async function(i) {
    if (!i.isButton()) return;
    if (!i.customId.startsWith('verify_')) return;

    const proofId = i.customId.replace('verify_', '');
    const proof = getProof(i.channelId, proofId);

    if (!proof) {
      return i.reply({ content: '⚠️  Proof expired.', ephemeral: true });
    }

    const commitment = crypto.createHash('sha256').update(proof.serverSeed).digest('hex');
    const hmac = crypto.createHmac('sha256', proof.serverSeed);
    hmac.update(proof.clientSeed + ':' + proof.nonce);
    const digest = hmac.digest('hex');

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle('🔒  Verified')
      .setThumbnail(IMAGES.logo)
      .setDescription(
        '**' + proof.game + '** — ' + proof.result + '\n' +
        '<@' + proof.userId + '>\n\n' +
        '`' + proof.serverSeed + '`\n' +
        'Client: `' + proof.clientSeed + '`  •  Nonce: `' + proof.nonce + '`\n' +
        'Commitment: `' + commitment.slice(0,32) + '...`\n\n' +
        '✅  Locked before the roll.'
      )
      .setTimestamp()
      .setFooter({ text: 'KONVAULT™  •  Provably Fair', iconURL: IMAGES.logo });

    await i.reply({ embeds: [embed], ephemeral: true });

    try {
      const ownerId = process.env.OWNER_ID;
      if (ownerId && i.user.id !== ownerId) {
        const owner = await client.users.fetch(ownerId);
        await owner.send({
          embeds: [new EmbedBuilder()
            .setColor(PURPLE)
            .setTitle('🔒  Verify Alert')
            .setDescription('**' + i.user.username + '** verified **' + proof.game + '**\nChannel: <#' + i.channelId + '>')
            .setTimestamp()
            .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
          ]
        });
      }
    } catch(e) {}
  });
}

module.exports = { storeProof, getProof, verifyRow, registerVerifyHandler };
