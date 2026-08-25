const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('🔒 Lock the current channel preventing regular members from sending messages')
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for lockdown').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const channel = interaction.channel;

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false,
      AddReactions: false
    });

    const embed = new EmbedBuilder()
      .setColor(colors.danger)
      .setTitle('🔒 Channel Locked')
      .setDescription(`This channel has been locked by a moderator.\n\n**Reason:** ${reason}`)
      .setFooter({ text: `Locked by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    await Logger.sendModLog(
      interaction.guild,
      'Channel Locked',
      `<#${channel.id}> was locked down by <@${interaction.user.id}>.`,
      [{ name: 'Reason', value: reason, inline: true }],
      colors.danger
    );
  }
};
