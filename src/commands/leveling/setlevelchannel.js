const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlevelchannel')
    .setDescription('✨ Set the designated channel where level-up announcements are sent')
    .addChannelOption(opt =>
      opt
        .setName('channel')
        .setDescription('Channel to send level-up congratulations')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt
        .setName('mode')
        .setDescription('Level-up announcement behavior mode')
        .setRequired(false)
        .addChoices(
          { name: '💬 Current Channel (where user chatted)', value: 'current' },
          { name: '📨 Direct Message (DM the user)', value: 'dm' },
          { name: '🤫 Silent (No announcements)', value: 'none' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const mode = interaction.options.getString('mode');
    const settings = db.getGuildSettings(interaction.guildId);

    if (!channel && !mode) {
      const currentChannel = settings.leveling.channelId
        ? settings.leveling.channelId === 'dm'
          ? '📨 Direct Messages'
          : settings.leveling.channelId === 'none'
          ? '🤫 Silent (Disabled)'
          : `<#${settings.leveling.channelId}>`
        : '💬 Current Channel (Default)';

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.primary)
            .setTitle('✨ Level-Up Announcement Channel')
            .setDescription(`Level up alerts are currently configured to: **${currentChannel}**\n\nTo change it, specify a \`channel\` or choose a \`mode\` (Current Channel, DM, or Silent).`)
        ],
        ephemeral: true
      });
    }

    if (channel) {
      settings.leveling.channelId = channel.id;
      db.updateGuildSettings(interaction.guildId, settings);

      const embed = new EmbedBuilder()
        .setColor(colors.success)
        .setTitle('✅ Level Channel Configured')
        .setDescription(`Level-up notifications will now be announced in <#${channel.id}>!`)
        .setFooter({ text: 'Members will be pinged when they level up in this channel' });

      return interaction.reply({ embeds: [embed] });
    }

    if (mode) {
      settings.leveling.channelId = mode === 'current' ? null : mode;
      db.updateGuildSettings(interaction.guildId, settings);

      const modeLabels = {
        current: '💬 Current Channel (where user sends message)',
        dm: '📨 Direct Messages (private message to user)',
        none: '🤫 Silent (Level ups happen in background without spam)'
      };

      const embed = new EmbedBuilder()
        .setColor(colors.success)
        .setTitle('✅ Level Notification Mode Updated')
        .setDescription(`Level-up notifications mode has been set to:\n**${modeLabels[mode]}**`);

      return interaction.reply({ embeds: [embed] });
    }
  }
};
