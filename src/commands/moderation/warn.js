const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const Logger = require('../../utils/logger');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('⚠️ Issue an official warning to a member')
    .addUserOption(opt => opt.setName('user').setDescription('The user to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the warning').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot warn yourself.', ephemeral: true });
    }

    if (targetUser.bot) {
      return interaction.reply({ content: '❌ You cannot warn bots.', ephemeral: true });
    }

    const warnEntry = db.addWarning(interaction.guildId, targetUser.id, interaction.user.id, reason);
    const totalWarns = db.getWarnings(interaction.guildId, targetUser.id).length;

    // Send DM to warned user
    try {
      await targetUser.send({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.warning)
            .setTitle(`⚠️ Warning in ${interaction.guild.name}`)
            .setDescription(`You have received an official warning.`)
            .addFields(
              { name: 'Reason', value: reason, inline: false },
              { name: 'Total Warnings', value: `${totalWarns}`, inline: true },
              { name: 'Warning ID', value: `\`${warnEntry.id}\``, inline: true }
            )
            .setTimestamp()
        ]
      });
    } catch (e) {}

    const embed = new EmbedBuilder()
      .setColor(colors.warning)
      .setTitle('⚠️ Member Warned')
      .setDescription(`**${targetUser.tag}** received warning **#${warnEntry.id}**.`)
      .addFields(
        { name: 'Reason', value: reason, inline: false },
        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Total Warnings', value: `${totalWarns}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    await Logger.sendModLog(
      interaction.guild,
      'Warning Issued',
      `<@${targetUser.id}> was warned by <@${interaction.user.id}>.`,
      [
        { name: 'Warning ID', value: warnEntry.id, inline: true },
        { name: 'Total Warnings', value: `${totalWarns}`, inline: true },
        { name: 'Reason', value: reason, inline: false }
      ],
      colors.warning
    );
  }
};
