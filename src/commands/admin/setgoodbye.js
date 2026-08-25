const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const db = require('../../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setgoodbye')
    .setDescription('👋 Configure goodbye notifications when members leave')
    .addChannelOption(opt =>
      opt
        .setName('channel')
        .setDescription('Channel where goodbye messages will be sent')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('message')
        .setDescription('Custom goodbye text (placeholders: {user.tag}, {server})')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');

    const settings = db.getGuildSettings(interaction.guildId);
    settings.goodbye.enabled = true;
    settings.goodbye.channelId = channel.id;
    if (message) settings.goodbye.message = message;

    db.updateGuildSettings(interaction.guildId, settings);

    await interaction.reply(
      `✅ **Goodbye Notifications Configured!**\n\n` +
      `• **Channel:** <#${channel.id}>\n` +
      `• **Message Format:** \`${settings.goodbye.message}\``
    );
  }
};
