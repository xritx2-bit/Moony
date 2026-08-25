const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('🔓 Unlock the current channel allowing members to chat')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.channel;

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null,
      AddReactions: null
    });

    const embed = new EmbedBuilder()
      .setColor(colors.success)
      .setTitle('🔓 Channel Unlocked')
      .setDescription('This channel has been unlocked. Members can now send messages.')
      .setFooter({ text: `Unlocked by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    await Logger.sendModLog(
      interaction.guild,
      'Channel Unlocked',
      `<#${channel.id}> was unlocked by <@${interaction.user.id}>.`,
      [],
      colors.success
    );
  }
};
