const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const db = require('../../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('👋 Configure automated welcome messages and graphical banner cards')
    .addChannelOption(opt =>
      opt
        .setName('channel')
        .setDescription('Channel where welcome banners and messages will be sent')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addRoleOption(opt =>
      opt
        .setName('auto_role')
        .setDescription('Role to automatically give new human members upon joining')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt
        .setName('message')
        .setDescription('Custom welcome text (placeholders: {user}, {server}, {memberCount})')
        .setRequired(false)
    )
    .addBooleanOption(opt =>
      opt
        .setName('dm_welcome')
        .setDescription('Also send a private welcome DM to the joining member?')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const autoRole = interaction.options.getRole('auto_role');
    const message = interaction.options.getString('message');
    const dmWelcome = interaction.options.getBoolean('dm_welcome');

    const settings = db.getGuildSettings(interaction.guildId);
    settings.welcome.enabled = true;
    settings.welcome.channelId = channel.id;

    if (autoRole) settings.welcome.autoRoleId = autoRole.id;
    if (message) settings.welcome.message = message;
    if (dmWelcome !== null) settings.welcome.dmWelcome = dmWelcome;

    db.updateGuildSettings(interaction.guildId, settings);

    await interaction.reply(
      `✅ **Welcome System Configured!**\n\n` +
      `• **Channel:** <#${channel.id}>\n` +
      `• **Auto Role:** ${settings.welcome.autoRoleId ? `<@&${settings.welcome.autoRoleId}>` : 'None'}\n` +
      `• **DM Welcome:** ${settings.welcome.dmWelcome ? 'Enabled' : 'Disabled'}\n` +
      `• **Message Format:** \`${settings.welcome.message}\`\n\n` +
      `*New members will receive an SVG welcome card with their avatar!*`
    );
  }
};
