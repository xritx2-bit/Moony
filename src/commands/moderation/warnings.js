const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('📋 Check a member\'s warning history')
    .addUserOption(opt => opt.setName('user').setDescription('The user to check').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const warns = db.getWarnings(interaction.guildId, targetUser.id);

    if (warns.length === 0) {
      return interaction.reply({
        content: `✅ **${targetUser.tag}** has no active warnings. Clean record!`,
        ephemeral: true
      });
    }

    const warnList = warns.map((w, idx) =>
      `\`${idx + 1}.\` **ID:** \`${w.id}\` | **Mod:** <@${w.moderatorId}> | **Date:** <t:${Math.floor(w.timestamp / 1000)}:d>\n> **Reason:** ${w.reason}`
    ).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(colors.warning)
      .setTitle(`📋 Warning History: ${targetUser.tag}`)
      .setDescription(warnList)
      .setFooter({ text: `Total Warnings: ${warns.length}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
