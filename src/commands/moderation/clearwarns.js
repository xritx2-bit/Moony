const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const Logger = require('../../utils/logger');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('🧹 Clear all warnings from a member')
    .addUserOption(opt => opt.setName('user').setDescription('The user whose warnings will be cleared').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const cleared = db.clearWarnings(interaction.guildId, targetUser.id);

    if (cleared === 0) {
      return interaction.reply({
        content: `ℹ️ **${targetUser.tag}** didn't have any warnings to clear.`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(colors.success)
      .setTitle('🧹 Warnings Cleared')
      .setDescription(`Cleared **${cleared}** warnings for **${targetUser.tag}**.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    await Logger.sendModLog(
      interaction.guild,
      'Warnings Cleared',
      `<@${interaction.user.id}> cleared **${cleared}** warnings for <@${targetUser.id}>.`,
      [],
      colors.success
    );
  }
};
