const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');
const colors = require('../../utils/colors');

function parseDurationToMs(durationStr) {
  const match = durationStr.match(/^(\d+)([smhd])$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 3600 * 1000;
    case 'd': return num * 86400 * 1000;
    default: return null;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('⏳ Mute / Timeout a member for a duration')
    .addUserOption(opt => opt.setName('user').setDescription('The member to timeout').setRequired(true))
    .addStringOption(opt =>
      opt
        .setName('duration')
        .setDescription('Duration (e.g. 60s, 5m, 10m, 1h, 1d, 7d)')
        .setRequired(true)
    )
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for timeout').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: '❌ Member not found in this guild.', ephemeral: true });
    }

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot timeout yourself.', ephemeral: true });
    }

    const ms = parseDurationToMs(durationStr);
    if (!ms || ms < 5000 || ms > 28 * 86400 * 1000) {
      return interaction.reply({
        content: '❌ Invalid duration. Must be between 5s and 28d (e.g. `5m`, `1h`, `1d`).',
        ephemeral: true
      });
    }

    if (!member.moderatable) {
      return interaction.reply({
        content: '❌ I cannot timeout this user (they might have higher roles or administrative permissions).',
        ephemeral: true
      });
    }

    if (interaction.member.roles.highest.position <= member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({
        content: '❌ You cannot timeout someone with an equal or higher role.',
        ephemeral: true
      });
    }

    await member.timeout(ms, `${reason} (Timed out by ${interaction.user.tag})`);

    const untilTimestamp = Math.floor((Date.now() + ms) / 1000);
    const embed = new EmbedBuilder()
      .setColor(colors.warning)
      .setTitle('⏳ Member Timed Out')
      .setDescription(`**${targetUser.tag}** has been timed out until <t:${untilTimestamp}:F> (<t:${untilTimestamp}:R>).`)
      .addFields(
        { name: 'Duration', value: durationStr, inline: true },
        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    await Logger.sendModLog(
      interaction.guild,
      'Member Timed Out',
      `<@${targetUser.id}> was timed out by <@${interaction.user.id}> for **${durationStr}**.`,
      [
        { name: 'Reason', value: reason, inline: true },
        { name: 'Expires', value: `<t:${untilTimestamp}:R>`, inline: true }
      ],
      colors.warning
    );
  }
};
