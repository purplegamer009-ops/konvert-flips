const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { wait, hmacRoll, secureShuffle, em, IMAGES, PURPLE } = require('../utils/theme');
const { log } = require('../utils/logger');

const FLOORS = 5;

function makeGrid() {
  return Array.from({ length: FLOORS }, () => hmacRoll(0, 2));
}

function buildDisplay(picks, currentFloor, dead, grid) {
  const lines = [];
  for (let f = FLOORS - 1; f >= 0; f--) {
    const picked = picks[f];
    const isActive = f === currentFloor && !dead;
    let row = '';
    for (let c = 0; c < 3; c++) {
      if (picked === undefined) {
        row += isActive ? '🟪 ' : '⬛ ';
      } else {
        if (c === picked && c === grid[f]) row += '💥 ';
        else if (c === picked) row += '💎 ';
        else if (c === grid[f] && (dead || f < currentFloor)) row += '💣 ';
        else row += '⬛ ';
      }
    }
    const label = isActive ? '**Floor ' + (f+1) + '** ▶' : (picked !== undefined ? (picked === grid[f] ? '💀 Floor ' + (f+1) : '✅ Floor ' + (f+1)) : 'Floor ' + (f+1));
    lines.push(label + '\n' + row.trim());
  }
  return lines.join('\n\n');
}

function towerEmbed(title, desc, imgKey) {
  return new EmbedBuilder()
    .setColor(PURPLE)
    .setTitle(title)
    .setDescription(desc)
    .setThumbnail(IMAGES.logo)
    .setImage(IMAGES[imgKey] || IMAGES.tower)
    .setTimestamp()
    .setFooter({ text: 'KONVAULT™  •  Tower Climb', iconURL: IMAGES.logo });
}

function floorButtons(userId, floor) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tw_' + userId + '_' + floor + '_0').setLabel('Tile 1').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('tw_' + userId + '_' + floor + '_1').setLabel('Tile 2').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('tw_' + userId + '_' + floor + '_2').setLabel('Tile 3').setStyle(ButtonStyle.Primary)
  );
}

async function runTower(channel, user) {
  const grid = makeGrid();
  const picks = {};
  let floor = 0;

  const msg = await channel.send({
    embeds: [towerEmbed(
      '🗼  ' + user.displayName + '\'s Tower',
      buildDisplay(picks, floor, false, grid) + '\n\n**Pick a tile to start climbing!**',
      'tower'
    )],
    components: [floorButtons(user.id, floor)],
  });

  while (floor < FLOORS) {
    const choice = await new Promise(function(resolve) {
      const timeout = setTimeout(function() { resolve(null); }, 45000);
      const collector = msg.createMessageComponentCollector({
        filter: function(b) {
          return b.user.id === user.id && b.customId.startsWith('tw_' + user.id + '_' + floor + '_');
        },
        time: 45000,
        max: 1,
      });
      collector.on('collect', async function(btn) {
        await btn.deferUpdate();
        clearTimeout(timeout);
        resolve(parseInt(btn.customId.split('_').pop()));
      });
      collector.on('end', function(_, reason) {
        if (reason === 'time') { clearTimeout(timeout); resolve(null); }
      });
    });

    if (choice === null) {
      await msg.edit({
        embeds: [towerEmbed('🗼  ' + user.displayName + '\'s Tower', buildDisplay(picks, floor, true, grid) + '\n\n⏰  Timed out — reached floor **' + floor + '** / ' + FLOORS, 'loss')],
        components: [],
      });
      return { floor };
    }

    picks[floor] = choice;
    const isBomb = choice === grid[floor];

    // Suspense — show ? briefly
    await msg.edit({
      embeds: [towerEmbed('🗼  ' + user.displayName + '\'s Tower', buildDisplay(picks, floor, false, grid) + '\n\n⏳  Revealing...', 'tower')],
      components: [],
    });
    await wait(1200);

    if (isBomb) {
      await msg.edit({
        embeds: [towerEmbed(
          '💥  ' + user.displayName + ' hit a bomb!',
          buildDisplay(picks, floor, true, grid) + '\n\n💀  Eliminated on floor **' + (floor + 1) + '**\nReached floor **' + floor + '** / ' + FLOORS,
          'loss'
        )],
        components: [],
      });
      return { floor };
    }

    floor++;

    if (floor >= FLOORS) {
      await msg.edit({
        embeds: [towerEmbed(
          '🏆  ' + user.displayName + ' conquered the tower!',
          buildDisplay(picks, floor - 1, false, grid) + '\n\n🎉  **ALL ' + FLOORS + ' FLOORS CLEARED!**',
          'win'
        )],
        components: [],
      });
      return { floor: FLOORS };
    }

    await msg.edit({
      embeds: [towerEmbed(
        '🗼  ' + user.displayName + '\'s Tower',
        buildDisplay(picks, floor, false, grid) + '\n\n✅  Safe! Now on **Floor ' + (floor + 1) + '** / ' + FLOORS + '\n\nKeep climbing!',
        'tower'
      )],
      components: [floorButtons(user.id, floor)],
    });
  }

  return { floor: FLOORS };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tower')
    .setDescription('🗼  1v1 Tower Climb — climb higher than your opponent!')
    .addUserOption(function(o) { return o.setName('opponent').setDescription('Who to challenge?').setRequired(true); }),

  async execute(interaction, client) {
    const opponent = interaction.options.getUser('opponent');
    if (opponent.id === interaction.user.id) return interaction.reply({ content: '🚫  You cannot play yourself.', ephemeral: true });
    if (opponent.bot) return interaction.reply({ content: '🚫  Cannot play against a bot.', ephemeral: true });

    await interaction.reply({
      content: '<@' + opponent.id + '>',
      embeds: [em('Konvault\' Tower Climb',
        '<@' + interaction.user.id + '> challenged <@' + opponent.id + '> to **1v1 Tower Climb!**\n\n' +
        '🗼  Climb **' + FLOORS + ' floors** by picking safe tiles\n' +
        '💣  One tile hides a bomb each floor — hit it and you fall\n' +
        '💎  Safe tile = climb higher\n' +
        '🏆  Whoever reaches the highest floor wins\n\n' +
        '<@' + opponent.id + '> — type `accept` or `decline`',
        null, 'tower'
      )]
    });

    let accepted = false;
    try {
      const col = await interaction.channel.awaitMessages({
        filter: function(m) { return m.author.id === opponent.id && ['accept','decline'].includes(m.content.toLowerCase().trim()); },
        max: 1, time: 30000, errors: ['time']
      });
      accepted = col.first().content.toLowerCase().trim() === 'accept';
      await col.first().delete().catch(function() {});
    } catch(e) {
      return interaction.channel.send({ embeds: [em('Konvault\' Tower Climb', '⏰  No response. Game cancelled.')] });
    }

    if (!accepted) return interaction.channel.send({ embeds: [em('Konvault\' Tower Climb', '❌  <@' + opponent.id + '> declined.')] });

    const players = secureShuffle([interaction.user, opponent]);

    await interaction.channel.send({ embeds: [em('Konvault\' Tower Climb',
      '🗼  **Game on!**\n\n' +
      '**' + players[0].displayName + '** goes first\n' +
      '**' + players[1].displayName + '** watches and waits\n\n' +
      'Click the tile buttons to climb! 💎 = safe  💣 = bomb  💥 = eliminated',
      null, 'tower'
    )] });

    await wait(800);

    // Player 1
    await interaction.channel.send({ embeds: [em('Konvault\' Tower Climb', '🗼  <@' + players[0].id + '> — start climbing! 👇')] });
    const r1 = await runTower(interaction.channel, players[0]);
    await wait(1200);

    // Show p1 score then p2 goes
    await interaction.channel.send({ embeds: [em('Konvault\' Tower Climb',
      '📊  <@' + players[0].id + '> finished at floor **' + r1.floor + '** / ' + FLOORS + '\n\n' +
      '🗼  Now <@' + players[1].id + '> — can you beat **' + r1.floor + '**? 👇'
    )] });

    await wait(500);

    // Player 2
    const r2 = await runTower(interaction.channel, players[1]);
    await wait(800);

    // Final result
    let line, winner;
    if (r1.floor > r2.floor) {
      winner = players[0];
      line = '🏆  **<@' + players[0].id + '> wins!**';
    } else if (r2.floor > r1.floor) {
      winner = players[1];
      line = '🏆  **<@' + players[1].id + '> wins!**';
    } else {
      line = '🤝  **TIE!**  Both reached floor **' + r1.floor + '**';
    }

    await interaction.channel.send({ embeds: [new EmbedBuilder()
      .setColor(winner ? 0x00E676 : PURPLE)
      .setTitle('🗼  Tower Climb — Final Result')
      .setDescription(
        '<@' + players[0].id + '>  ' + (r1.floor >= FLOORS ? '🏆' : '') + '  Floor **' + r1.floor + '** / ' + FLOORS + '\n' +
        '<@' + players[1].id + '>  ' + (r2.floor >= FLOORS ? '🏆' : '') + '  Floor **' + r2.floor + '** / ' + FLOORS + '\n\n' +
        line
      )
      .setImage(winner ? IMAGES.win : IMAGES.tower)
      .setThumbnail(IMAGES.logo)
      .setTimestamp()
      .setFooter({ text: 'KONVAULT™', iconURL: IMAGES.logo })
    ] });

    await log(client, {
      user: winner || players[0],
      game: '1v1 Tower Climb',
      result: winner ? 'WIN' : 'TIE',
      detail: players[0].username + ': floor ' + r1.floor + '  vs  ' + players[1].username + ': floor ' + r2.floor,
    });
  },
};
