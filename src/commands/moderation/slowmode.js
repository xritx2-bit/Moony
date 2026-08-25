const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Logger = require('../../utils/logger');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('🐢 Set rate limit / slowmode on the current channel')
    .addIntegerOption(opt =>
      opt
        .setName('seconds')
        .setDescription('Slowmode delay in seconds (0 to disable, max 21600 / 6h)')
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('seconds');
    await interaction.channel.setRateLimitPerUser(seconds);

    if (seconds === 0) {
      await interaction.reply('⚡ Slowmode has been **disabled** for this channel.');
    } else {
      await interaction.reply(`🐢 Slowmode set to **${seconds} seconds** per user.`);
    }

    await Logger.sendModLog(
      interaction.guild,
      'Slowmode Changed',
      `<#${interaction.channel.id}> slowmode set to **${seconds}s** by <@${interaction.user.id}>.`,
      [],
      colors.info
    );
  }
};
