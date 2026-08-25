const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

function parseTimeStringToMs(timeStr) {
  const match = timeStr.match(/^(\d+)([smhd])$/i);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's': return val * 1000;
    case 'm': return val * 60 * 1000;
    case 'h': return val * 3600 * 1000;
    case 'd': return val * 86400 * 1000;
    default: return null;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('⏰ Set a timed reminder for yourself')
    .addStringOption(opt =>
      opt
        .setName('time')
        .setDescription('Time until reminder triggers (e.g. 10s, 15m, 2h, 1d)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('message')
        .setDescription('What do you want to be reminded about?')
        .setRequired(true)
    ),

  async execute(interaction) {
    const timeStr = interaction.options.getString('time');
    const message = interaction.options.getString('message');

    const durationMs = parseTimeStringToMs(timeStr);
    if (!durationMs || durationMs < 5000 || durationMs > 30 * 86400 * 1000) {
      return interaction.reply({
        content: '❌ Invalid time format. Examples: `10m`, `2h`, `1d` (Min 5s, Max 30 days).',
        ephemeral: true
      });
    }

    const fireAt = Date.now() + durationMs;
    const reminder = db.addReminder(
      interaction.user.id,
      interaction.guildId,
      interaction.channel.id,
      message,
      fireAt
    );

    const embed = new EmbedBuilder()
      .setColor(colors.warning)
      .setTitle('⏰ Reminder Scheduled!')
      .setDescription(`I will remind you about:\n> **${message}**\n\nTriggering <t:${Math.floor(fireAt / 1000)}:R> (<t:${Math.floor(fireAt / 1000)}:f>).`)
      .setFooter({ text: `Reminder ID: ${reminder.id}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
