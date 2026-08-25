const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('🔊 Remove timeout from a member')
    .addUserOption(opt => opt.setName('user').setDescription('The member to untimeout').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for removing timeout').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: '❌ Member not found in this guild.', ephemeral: true });
    }

    if (!member.isCommunicationDisabled()) {
      return interaction.reply({ content: '⚠️ This member is not currently timed out.', ephemeral: true });
    }

    await member.timeout(null, `${reason} (Untimed out by ${interaction.user.tag})`);

    const embed = new EmbedBuilder()
      .setColor(colors.success)
      .setTitle('🔊 Timeout Removed')
      .setDescription(`Timeout removed for **${targetUser.tag}**.`)
      .addFields(
        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Reason', value: reason, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    await Logger.sendModLog(
      interaction.guild,
      'Timeout Removed',
      `<@${targetUser.id}> had their timeout removed by <@${interaction.user.id}>.`,
      [{ name: 'Reason', value: reason, inline: true }],
      colors.success
    );
  }
};
