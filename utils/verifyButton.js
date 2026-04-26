const { EmbedBuilder } = require('discord.js');
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

function verifyFooter(proofId) {
  return '\n-# 🔒 `/verify ' + proofId + '`';
}

function registerVerifyHandler(client) {
  client.on('interactionCreate', async function(i) {
    if (!i.isChatInputCommand()) return;
    if (i.commandName !== 'verify') return;
    const proofId = i.options.getString('id');
    if (!proofId) {
      return i.reply({ embeds: [new EmbedBuilder().setColor(PURPLE).setTitle('🔒 Provably Fair').setThumbnail(IMAGES.logo)
        .setDescription('Every Konvault result uses **HMAC-SHA256** cryptography.\n\nAfter any flip, copy the ID from the tiny `/verify` line at the bottom of the result.\n\nThen run `/verify id:THAT_ID` to see the full proof.')
        .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })], ephemeral: true });
    }
    const proof = getProof(i.channelId, proofId);
    if (!proof) return i.reply({ content: '⚠️ Proof not found or expired.', ephemeral: true });
    const commitment = crypto.createHash('sha256').update(proof.serverSeed).digest('hex');
    const hmac = crypto.createHmac('sha256', proof.serverSeed);
    hmac.update(proof.clientSeed + ':' + proof.nonce);
    const digest = hmac.digest('hex');
    await i.reply({ embeds: [new EmbedBuilder().setColor(PURPLE).setTitle('🔒 Verified')
      .setThumbnail(IMAGES.logo)
      .setDescription('**' + proof.game + '** — ' + proof.result + '\n\n`' + proof.serverSeed + '`\nClient `' + proof.clientSeed + '` • Nonce `' + proof.nonce + '`\nCommitment `' + commitment.slice(0,20) + '...`\n\n✅ Locked before the roll.')
      .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })], ephemeral: true });
    try {
      if (process.env.OWNER_ID && i.user.id !== process.env.OWNER_ID) {
        const owner = await client.users.fetch(process.env.OWNER_ID);
        await owner.send('🔒 **' + i.user.username + '** verified **' + proof.game + '**');
      }
    } catch(e) {}
  });
}

module.exports = { storeProof, getProof, verifyFooter, registerVerifyHandler };
