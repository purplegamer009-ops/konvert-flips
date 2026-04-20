if (lower === '?cf') {
    const roll = generateFairRoll(1, 2);
    const result = roll.result === 1 ? 'HEADS' : 'TAILS';
    const proofId = storeProof(msg.channelId, {
      id: Date.now() + '_cf_text',
      game: 'Coinflip',
      result,
      userId: msg.author.id,
      serverSeed: roll.serverSeed,
      clientSeed: roll.clientSeed,
      nonce: roll.nonce,
    });
    await msg.channel.send({
      embeds: [em('Konvault\' Coinflip', (result==='HEADS'?'🟡':'⚪')+'  **'+result+'**', null, 'coinflip')],
      components: [verifyRow(proofId)],
    });
    return;
  }

  if (lower === '?dice' || lower === '?roll') {
    const roll1 = generateFairRoll(1, 6);
    const roll2 = generateFairRoll(1, 6);
    const d1 = roll1.result, d2 = roll2.result;
    const proofId = storeProof(msg.channelId, {
      id: Date.now() + '_dice_text',
      game: 'Dice',
      result: d1 + ' & ' + d2 + ' = ' + (d1+d2),
      userId: msg.author.id,
      serverSeed: roll1.serverSeed,
      clientSeed: roll1.clientSeed,
      nonce: roll1.nonce,
    });
    await msg.channel.send({
      embeds: [em('Konvault\' Dice Roll', '**'+msg.author.displayName+'** rolled **'+d1+'** & **'+d2+'**\n\nTotal: **'+(d1+d2)+'**', null, 'dice')],
      components: [verifyRow(proofId)],
    });
    return;
  }
