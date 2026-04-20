const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');

const { hmacRoll } = require('../utils/theme');

const FLOORS = 5;
const OPTIONS = 3;

function makeButtons(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('1').setLabel('1').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('2').setLabel('2').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('3').setLabel('3').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
  );
}

function renderTower(currentFloor) {
  let out = "";
  for (let i = 1; i <= FLOORS; i++) {
    if (i < currentFloor) {
      out += `🟣🟣🟣  Floor ${i} (SAFE)\n`;
    } else if (i === currentFloor) {
      out += `⬜⬜⬜  Floor ${i} (ACTIVE)\n`;
    } else {
      out += `⬛⬛⬛  Floor ${i}\n`;
    }
  }
  return out;
}

async function runTower(channel, user) {
  let floor = 1;

  while (floor <= FLOORS) {
    const mine = hmacRoll(0, 2);

    const embed = new EmbedBuilder()
      .setTitle("🟣 TOWERZ")
      .setColor(0x8b5cf6)
      .setDescription(
        `**Player:** <@${user.id}>\n\n` +
        renderTower(floor) +
        `\nPick a box (1–3)`
      );

    const msg = await channel.send({
      embeds: [embed],
      components: [makeButtons(false)]
    });

    let choice;

    try {
      const interaction = await msg.awaitMessageComponent({
        componentType: ComponentType.Button,
        time: 30000,
        filter: i => i.user.id === user.id
      });

      choice = parseInt(interaction.customId) - 1;
      await interaction.deferUpdate();
    } catch {
      await msg.edit({ components: [] });
      return floor - 1;
    }

    const safe = choice !== mine;

    const reveal = ["⬜", "⬜", "⬜"];
    reveal[mine] = "💣";
    reveal[choice] = safe ? "💎" : "💥";

    const resultEmbed = new EmbedBuilder()
      .setTitle("🟣 TOWERZ RESULT")
      .setColor(safe ? 0x22c55e : 0xef4444)
      .setDescription(
        renderTower(safe ? floor + 1 : floor) +
        `\n${reveal.map((x, i) => `${x} ${i + 1}`).join("  ")}\n\n` +
        (safe
          ? `💎 Safe — advancing to floor ${floor + 1}`
          : `💣 Hit mine — stopped at floor ${floor}`)
      );

    await msg.edit({ embeds: [resultEmbed], components: [] });

    if (!safe) return floor;

    floor++;
  }

  return FLOORS;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('towerz')
    .setDescription('🟣 Towerz — climb the 3x5 tower')
    .addUserOption(o =>
      o.setName('opponent')
        .setDescription('Challenge a player')
        .setRequired(true)
    ),

  async execute(interaction) {
    const opponent = interaction.options.getUser('opponent');

    if (opponent.id === interaction.user.id)
      return interaction.reply({ content: "🚫 You can't play yourself.", ephemeral: true });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🟣 TOWERZ CHALLENGE")
          .setColor(0x8b5cf6)
          .setDescription(
            `<@${interaction.user.id}> vs <@${opponent.id}>\n\n` +
            `🟣 3×5 Tower Run\n💎 Diamonds = progress\n💣 Mines = elimination\n\n` +
            `Opponent type **accept** or **decline**`
          )
      ]
    });

    let accepted;

    try {
      const col = await interaction.channel.awaitMessages({
        filter: m => m.author.id === opponent.id,
        max: 1,
        time: 30000
      });

      accepted = col.first().content.toLowerCase() === "accept";
    } catch {
      return interaction.channel.send("⏰ No response — cancelled.");
    }

    if (!accepted)
      return interaction.channel.send(`❌ <@${opponent.id}> declined.`);

    const p1 = interaction.user;
    const p2 = opponent;

    await interaction.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🟣 TOWERZ STARTING")
          .setColor(0x8b5cf6)
          .setDescription(`First: <@${p1.id}>`)
      ]
    });

    const s1 = await runTower(interaction.channel, p1);

    await interaction.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🟣 NEXT PLAYER")
          .setColor(0x8b5cf6)
          .setDescription(`Now playing: <@${p2.id}>`)
      ]
    });

    const s2 = await runTower(interaction.channel, p2);

    let result;

    if (s1 > s2) result = `🏆 <@${p1.id}> wins`;
    else if (s2 > s1) result = `🏆 <@${p2.id}> wins`;
    else result = "🤝 Tie";

    await interaction.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🟣 TOWERZ RESULT")
          .setColor(0xfacc15)
          .setDescription(
            `<@${p1.id}> → Floor ${s1}\n` +
            `<@${p2.id}> → Floor ${s2}\n\n` +
            result
          )
      ]
    });
  }
};
