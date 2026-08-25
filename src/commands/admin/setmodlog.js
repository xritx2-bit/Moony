const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const db = require('../../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setmodlog')
    .setDescription('🛡️ Configure security and moderation audit log channel')
    .addChannelOption(opt =>
      opt
        .setName('channel')
        .setDescription('Channel where ban, kick, mute, warn, and purge logs will be posted')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');

    const settings = db.getGuildSettings(interaction.guildId);
    settings.modLogChannel = channel.id;
    db.updateGuildSettings(interaction.guildId, settings);

    await interaction.reply(`🛡️ Moderation and security audit logging is now active in <#${channel.id}>!`);
  }
};
