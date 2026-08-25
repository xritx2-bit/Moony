const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🔨 Ban a member from the server')
    .addUserOption(opt => opt.setName('user').setDescription('The user to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the ban').setRequired(false))
    .addIntegerOption(opt =>
      opt
        .setName('delete_messages')
        .setDescription('Days of message history to delete')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_messages') || 0;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot ban yourself.', ephemeral: true });
    }

    if (targetUser.id === interaction.client.user.id) {
      return interaction.reply({ content: '❌ I cannot ban myself.', ephemeral: true });
    }

    if (member) {
      if (!member.bannable) {
        return interaction.reply({
          content: '❌ I cannot ban this member! Their role may be higher than mine or they have administrator privileges.',
          ephemeral: true
        });
      }

      if (interaction.member.roles.highest.position <= member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
        return interaction.reply({
          content: '❌ You cannot ban a member whose role is equal or higher than yours.',
          ephemeral: true
        });
      }
    }

    // Try sending DM to banned user
    try {
      await targetUser.send({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.danger)
            .setTitle(`🔨 You have been banned from ${interaction.guild.name}`)
            .setDescription(`**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}`)
            .setTimestamp()
        ]
      });
    } catch (e) {
      // DM closed
    }

    await interaction.guild.members.ban(targetUser.id, {
      deleteMessageSeconds: deleteDays * 86400,
      reason: `${reason} (Banned by ${interaction.user.tag})`
    });

    const embed = new EmbedBuilder()
      .setColor(colors.danger)
      .setTitle('🔨 Member Banned')
      .setDescription(`**${targetUser.tag}** (\`${targetUser.id}\`) has been banned.`)
      .addFields(
        { name: 'Reason', value: reason, inline: true },
        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Purged Messages', value: `${deleteDays} days`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    await Logger.sendModLog(
      interaction.guild,
      'Member Banned',
      `<@${targetUser.id}> (\`${targetUser.tag}\`) was banned by <@${interaction.user.id}>.`,
      [
        { name: 'User ID', value: targetUser.id, inline: true },
        { name: 'Reason', value: reason, inline: true },
        { name: 'Messages Purged', value: `${deleteDays} days`, inline: true }
      ],
      colors.danger
    );
  }
};
