const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('👢 Kick a member from the server')
    .addUserOption(opt => opt.setName('user').setDescription('The user to kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the kick').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: '❌ That user is not in this server.', ephemeral: true });
    }

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot kick yourself.', ephemeral: true });
    }

    if (targetUser.id === interaction.client.user.id) {
      return interaction.reply({ content: '❌ I cannot kick myself.', ephemeral: true });
    }

    if (!member.kickable) {
      return interaction.reply({
        content: '❌ I cannot kick this member! Their role may be higher than mine or they have administrator privileges.',
        ephemeral: true
      });
    }

    if (interaction.member.roles.highest.position <= member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({
        content: '❌ You cannot kick a member whose role is equal or higher than yours.',
        ephemeral: true
      });
    }

    try {
      await targetUser.send({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.warning)
            .setTitle(`👢 You have been kicked from ${interaction.guild.name}`)
            .setDescription(`**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}`)
            .setTimestamp()
        ]
      });
    } catch (e) {}

    await member.kick(`${reason} (Kicked by ${interaction.user.tag})`);

    const embed = new EmbedBuilder()
      .setColor(colors.warning)
      .setTitle('👢 Member Kicked')
      .setDescription(`**${targetUser.tag}** (\`${targetUser.id}\`) has been kicked.`)
      .addFields(
        { name: 'Reason', value: reason, inline: true },
        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    await Logger.sendModLog(
      interaction.guild,
      'Member Kicked',
      `<@${targetUser.id}> (\`${targetUser.tag}\`) was kicked by <@${interaction.user.id}>.`,
      [
        { name: 'User ID', value: targetUser.id, inline: true },
        { name: 'Reason', value: reason, inline: true }
      ],
      colors.warning
    );
  }
};
