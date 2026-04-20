const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require(‘discord.js’);
const { em, wait, hmacRoll, secureShuffle } = require(’../utils/theme’);
const { generateFairRoll } = require(’../utils/theme’);
const { log } = require(’../utils/logger’);

const FLOORS = 5;
const COLS = 3;

// Generate a grid: for each floor, which column is the bomb
function generateGrid() {
const grid = [];
for (let f = 0; f < FLOORS; f++) {
grid.push(hmacRoll(0, COLS - 1)); // bomb position per floor
}
return grid;
}

// Build the visual grid embed description
// floorRevealed: array of picked column per floor (-1 = not picked yet)
// currentFloor: which floor player is on (0-indexed from bottom)
// dead: if player hit a bomb
function buildGrid(grid, picks, currentFloor, done) {
const rows = [];
// Render from top (floor 4) to bottom (floor 0)
for (let f = FLOORS - 1; f >= 0; f–) {
const isCurrentFloor = f === currentFloor && !done;
const isPast = f < currentFloor || done;
const cols = [];
for (let c = 0; c < COLS; c++) {
const pickedThisFloor = picks[f] !== undefined;
const playerPicked = picks[f] === c;
const isBomb = grid[f] === c;

```
  let cell;
  if (!pickedThisFloor && !isPast) {
    // Not revealed yet
    cell = isCurrentFloor ? '🟪' : '⬛';
  } else if (pickedThisFloor) {
    // Revealed
    if (playerPicked && isBomb) cell = '💥';
    else if (playerPicked && !isBomb) cell = '💎';
    else if (!playerPicked && isBomb) cell = '💣';
    else cell = '⬛';
  } else {
    cell = '⬛';
  }
  cols.push(cell);
}
const floorLabel = f === currentFloor && !done ? '▶' : (picks[f] !== undefined ? (picks[f] === grid[f] ? '💀' : '✅') : '  ');
rows.push(floorLabel + '  ' + cols.join('  '));
```

}
return rows.join(’\n’);
}

// Play one player’s full tower run using buttons
async function playTower(client, channel, user, fairSeeds) {
const grid = generateGrid();
const picks = {};
let currentFloor = 0;
let dead = false;

// Initial embed
const getEmbed = (desc, imgKey) => {
const { EmbedBuilder } = require(‘discord.js’);
const { IMAGES, PURPLE } = require(’../utils/theme’);
return new EmbedBuilder()
.setColor(PURPLE)
.setTitle(’🗼  Konvault' Tower — ’ + user.displayName)
.setDescription(desc)
.setThumbnail(IMAGES.logo)
.setImage(imgKey ? IMAGES[imgKey] : IMAGES.tower)
.setTimestamp()
.setFooter({ text: ‘KONVAULT™’, iconURL: IMAGES.logo });
};

const getButtons = (floor) => {
return new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId(‘tower_’ + user.id + ‘*’ + floor + ‘*0’).setLabel(‘1’).setStyle(ButtonStyle.Secondary),
new ButtonBuilder().setCustomId(’tower*’ + user.id + ’*’ + floor + ‘*1’).setLabel(‘2’).setStyle(ButtonStyle.Secondary),
new ButtonBuilder().setCustomId(’tower*’ + user.id + ‘_’ + floor + ‘_2’).setLabel(‘3’).setStyle(ButtonStyle.Secondary),
);
};

const gridDesc = () =>
‘`\n' + buildGrid(grid, picks, currentFloor, dead) + '\n`\n’ +
(dead ? ‘💥  Hit a bomb on floor **’ + (currentFloor + 1) + ’**!’ :
currentFloor >= FLOORS ? ‘🏆  Reached the top!’ :
‘\n**Floor ’ + (currentFloor + 1) + ’ / ’ + FLOORS + ’**  —  Pick a tile: **1**, **2**, or **3**’);

const msg = await channel.send({
embeds: [getEmbed(gridDesc())],
components: currentFloor < FLOORS ? [getButtons(currentFloor)] : [],
});

// Wait for button clicks floor by floor
while (currentFloor < FLOORS && !dead) {
const choice = await new Promise(resolve => {
const timeout = setTimeout(() => resolve(null), 45000);
const col = msg.createMessageComponentCollector({
filter: b => b.user.id === user.id && b.customId.startsWith(‘tower_’ + user.id + ‘*’ + currentFloor + ’*’),
time: 45000,
max: 1,
});
col.on(‘collect’, async btn => {
await btn.deferUpdate();
clearTimeout(timeout);
const picked = parseInt(btn.customId.split(’*’).pop());
resolve(picked);
});
col.on(‘end’, (*, r) => { if (r === ‘time’) { clearTimeout(timeout); resolve(null); } });
});

```
if (choice === null) {
  await msg.edit({ embeds: [getEmbed('⏰  Timed out on floor **' + (currentFloor + 1) + '**\nReached floor **' + currentFloor + '**', 'loss')], components: [] });
  return { floor: currentFloor, timedOut: true };
}

picks[currentFloor] = choice;

if (choice === grid[currentFloor]) {
  dead = true;
  await msg.edit({
    embeds: [getEmbed('```\n' + buildGrid(grid, picks, currentFloor, true) + '\n```\n\n💥  **BOOM!** Hit a bomb on floor **' + (currentFloor + 1) + '**!\nReached floor **' + currentFloor + '**', 'loss')],
    components: [],
  });
  return { floor: currentFloor };
}

currentFloor++;

if (currentFloor >= FLOORS) {
  await msg.edit({
    embeds: [getEmbed('```\n' + buildGrid(grid, picks, currentFloor, false) + '\n```\n\n🏆  **Reached the top! All ' + FLOORS + ' floors cleared!**', 'win')],
    components: [],
  });
  return { floor: FLOORS };
}

await msg.edit({
  embeds: [getEmbed(gridDesc())],
  components: [getButtons(currentFloor)],
});
```

}

return { floor: currentFloor };
}

module.exports = {
data: new SlashCommandBuilder()
.setName(‘tower’)
.setDescription(‘🗼  1v1 Tower Climb — climb higher than your opponent!’)
.addUserOption(o => o.setName(‘opponent’).setDescription(‘Who to challenge?’).setRequired(true)),

async execute(interaction, client) {
const opponent = interaction.options.getUser(‘opponent’);
if (opponent.id === interaction.user.id) return interaction.reply({ content: ‘🚫  You cannot play yourself.’, ephemeral: true });
if (opponent.bot) return interaction.reply({ content: ‘🚫  Cannot play against a bot.’, ephemeral: true });

```
await interaction.reply({
  content: `<@${opponent.id}>`,
  embeds: [em('Konvault\' Tower Climb',
    '<@' + interaction.user.id + '> challenged <@' + opponent.id + '> to **1v1 Tower Climb!**\n\n' +
    '🗼  Click tiles to climb **' + FLOORS + ' floors**\n' +
    '💣  Each floor hides one bomb — hit it and you fall\n' +
    '💎  Find the safe tiles to climb higher\n' +
    '🏆  Whoever reaches the highest floor wins\n\n' +
    '<@' + opponent.id + '> — type `accept` or `decline`',
    null, 'tower'
  )]
});

let accepted = false;
try {
  const col = await interaction.channel.awaitMessages({
    filter: m => m.author.id === opponent.id && ['accept','decline'].includes(m.content.toLowerCase().trim()),
    max: 1, time: 30000, errors: ['time']
  });
  accepted = col.first().content.toLowerCase().trim() === 'accept';
  await col.first().delete().catch(() => {});
} catch {
  return interaction.channel.send({ embeds: [em('Konvault\' Tower Climb', '⏰  No response. Game cancelled.')] });
}

if (!accepted) return interaction.channel.send({ embeds: [em('Konvault\' Tower Climb', '❌  <@' + opponent.id + '> declined.')] });

// Randomly pick who goes first
const players = secureShuffle([interaction.user, opponent]);

await interaction.channel.send({ embeds: [em('Konvault\' Tower Climb',
  '🗼  Game on!\n\n**' + players[0].displayName + '** goes first\n\nClick the numbered buttons to pick your tile each floor!\n💣 = bomb  💎 = safe',
  null, 'tower'
)] });

await wait(500);

// Player 1 goes
await interaction.channel.send({ embeds: [em('Konvault\' Tower Climb', '<@' + players[0].id + '> — your turn! Click the tiles below 👇')] });
const r1 = await playTower(client, interaction.channel, players[0], {});
await wait(1000);

// Player 2 goes
await interaction.channel.send({ embeds: [em('Konvault\' Tower Climb',
  '<@' + players[0].id + '> reached floor **' + r1.floor + '** / ' + FLOORS + '\n\n' +
  'Now <@' + players[1].id + '> — beat that! Click the tiles below 👇'
)] });
const r2 = await playTower(client, interaction.channel, players[1], {});
await wait(500);

// Result
let line, winner;
if (r1.floor > r2.floor) { winner = players[0]; line = '🏆  **<@' + players[0].id + '> wins!**  Floor **' + r1.floor + '** vs **' + r2.floor + '**'; }
else if (r2.floor > r1.floor) { winner = players[1]; line = '🏆  **<@' + players[1].id + '> wins!**  Floor **' + r2.floor + '** vs **' + r1.floor + '**'; }
else { line = '🤝  **TIE!**  Both reached floor **' + r1.floor + '**'; }

await interaction.channel.send({ embeds: [em('Konvault\' Tower Climb — Result',
  '<@' + players[0].id + '>  Floor **' + r1.floor + '** / ' + FLOORS + '\n' +
  '<@' + players[1].id + '>  Floor **' + r2.floor + '** / ' + FLOORS + '\n\n' +
  line,
  null, winner ? 'win' : 'tower'
)] });

await log(client, {
  user: winner ?? players[0],
  game: '1v1 Tower Climb',
  result: winner ? 'WIN' : 'TIE',
  detail: players[0].username + ': floor ' + r1.floor + '  vs  ' + players[1].username + ': floor ' + r2.floor,
});
```

},
};
