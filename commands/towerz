const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');

const { em, wait, hmacRoll, secureShuffle } = require('../utils/theme');
const { log } = require('../utils/logger');

const TOTAL_FLOORS = 5;

// create buttons
function getButtons(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('1').setLabel('1').setStyle(ButtonStyle.Primary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('2').setLabel('2').setStyle(ButtonStyle.Primary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('3').setLabel('3').setStyle(ButtonStyle.Primary).setDisabled(disabled)
  );
}

async function playFloor(channel, player, floor) {
  const mine = hmacRoll(0, 2);

  const embed = new EmbedBuilder()
    .setTitle("🗼 KONVAULT — Tower Climb")
    .setColor(0x8b5cf6)
    .setDescription(
      `**Floor ${floor} / ${TOTAL_FLOORS}**\n\n` +
      `<@${player.id}> choose a vault box below`
    );

  const msg = await channel.send({
    embeds: [embed],
    components: [getButtons(false)]
  });

  let choice;

  try {
    const interaction = await msg.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: 30000,
      filter: i => i.user.id === player.id
    });

    choice = parseInt(interaction.customId) - 1;
    await interaction.deferUpdate();
  } catch {
    await msg.edit({ components: [] });
    return { result: "timeout" };
  }

  const isSafe = choice !== mine;

  const reveal = ["⬜", "⬜", "⬜"];
  reveal[mine] = "💣";
  reveal[choice] = isSafe ? "💎" : "💥";

  const resultEmbed = new EmbedBuilder()
    .setTitle("🗼 KONVAULT — Result")
    .setColor(isSafe ? 0x22c55e : 0xef4444)
    .setDescription(
      `**Floor ${floor} Result**\n\n` +
      `${reveal.map((x, i) => `${x} Box ${i + 1}`).join("  •  ")}\n\n` +
      (isSafe
        ? `💎 <@${player.id}> found a DIAMOND and advances!`
        : `💣 <@${player.id}> hit a MINE and is eliminated at floor ${floor}`)
    );

  await msg.edit({ embeds: [resultEmbed], components: [] });

  return {
    result: isSafe ? "safe" : "dead",
    floor: isSafe ? floor : floor - 1
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('konvault')
    .setDescription('🗼 Konvault Tower Climb (diamond vs mine)')
    .addUserOption(o =>
      o.setName('opponent')
        .setDescription('Challenge a player')
        .setRequired(true)
    ),

  async execute(interaction) {
    const opponent = interaction.options.getUser('opponent');

    if (opponent.id === interaction.user.id)
      return interaction.reply({ content: "🚫 You can't play yourself.", ephemeral: true });

    if (opponent.bot)
      return interaction.reply({ content: "🚫 Bots can't play.", ephemeral: true });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🗼 KONVAULT Challenge")
          .setColor(0x8b5cf6)
          .setDescription(
            `<@${interaction.user.id}> challenged <@${opponent.id}>\n\n` +
            `💎 Find diamonds. Avoid mines.\n` +
            `Highest floor wins.\n\n` +
            `<@${opponent.id}> type **accept** or **decline**`
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
      return interaction.channel.send("⏰ Challenge expired.");
    }

    if (!accepted)
      return interaction.channel.send(`❌ <@${opponent.id}> declined.`);

    const players = secureShuffle([interaction.user, opponent]);

    const score = {
      [players[0].id]: 0,
      [players[1].id]: 0
    };

    await interaction.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🗼 KONVAULT STARTED")
          .setColor(0x8b5cf6)
          .setDescription(
            `Order:\n1️⃣ <@${players[0].id}>\n2️⃣ <@${players[1].id}>\n\nLet the climb begin...`
          )
      ]
    });

    for (let floor = 1; floor <= TOTAL_FLOORS; floor++) {
      for (const player of players) {
        if (score[player.id] === -1) continue;

        const res = await playFloor(interaction.channel, player, floor);

        if (res.result === "timeout") return;

        if (res.result === "dead") {
          score[player.id] = floor - 1;
          score[player.id] = -1;
        } else {
          score[player.id] = floor;
        }

        await wait(800);
      }
    }

    const s1 = Math.max(0, score[players[0].id]);
    const s2 = Math.max(0, score[players[1].id]);

    let result;

    if (s1 > s2) result = `🏆 <@${players[0].id}> wins`;
    else if (s2 > s1) result = `🏆 <@${players[1].id}> wins`;
    else result = "🤝 Tie";

    await interaction.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🗼 KONVAULT RESULT")
          .setColor(0xfacc15)
          .setDescription(
            `<@${players[0].id}> → Floor ${s1}\n` +
            `<@${players[1].id}> → Floor ${s2}\n\n` +
            result
          )
      ]
    });

    await log(interaction.client, {
      user: players[0],
      game: "Konvault Tower",
      result,
      detail: `${players[0].username}: ${s1} vs ${players[1].username}: ${s2}`
    });
  }
};
