const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('feed')
    .setDescription('📡 Manage automated background alerts for YouTube, Reddit, and RSS feeds')
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Add a new feed notification to a channel')
        .addStringOption(opt =>
          opt
            .setName('type')
            .setDescription('Feed platform')
            .setRequired(true)
            .addChoices(
              { name: '📺 YouTube Channel (RSS XML URL)', value: 'youtube' },
              { name: '👽 Reddit Subreddit (e.g. r/gaming or gaming)', value: 'reddit' },
              { name: '📰 Custom RSS / Blog Feed URL', value: 'rss' }
            )
        )
        .addStringOption(opt =>
          opt
            .setName('source')
            .setDescription('Subreddit name (e.g. space) or RSS / YouTube feed URL')
            .setRequired(true)
        )
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Channel where new updates will be posted')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('custom_message')
            .setDescription('Custom alert message (use {url} and {title} as placeholders)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('List all active feeds for this server')
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove a feed by its ID')
        .addStringOption(opt => opt.setName('id').setDescription('Feed ID (from /feed list)').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === 'add') {
      const type = interaction.options.getString('type');
      const source = interaction.options.getString('source');
      const channel = interaction.options.getChannel('channel');
      const customMessage = interaction.options.getString('custom_message');

      const feed = db.addFeed(guildId, channel.id, type, source, customMessage);

      const embed = new EmbedBuilder()
        .setColor(colors.success)
        .setTitle('📡 Background Feed Added!')
        .setDescription(`Successfully subscribed to **${source}** (\`${type}\`).`)
        .addFields(
          { name: 'Feed ID', value: `\`${feed.id}\``, inline: true },
          { name: 'Posting Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Check Interval', value: 'Every 2 minutes', inline: true }
        )
        .setFooter({ text: 'Moony Scheduler • Real-time background feed polling' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'list') {
      const allFeeds = db.getFeeds().filter(f => f.guildId === guildId);

      if (allFeeds.length === 0) {
        return interaction.reply({ content: 'ℹ️ No active feeds found for this server. Use `/feed add` to configure one!', ephemeral: true });
      }

      const list = allFeeds.map(f =>
        `• **ID:** \`${f.id}\` | **Type:** \`${f.type}\` | **Channel:** <#${f.channelId}>\n  **Source:** \`${f.source}\``
      ).join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle(`📡 Active Feeds (${allFeeds.length})`)
        .setDescription(list)
        .setFooter({ text: 'Delete any feed using /feed remove id: <id>' });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'remove') {
      const feedId = interaction.options.getString('id');
      const removed = db.removeFeed(guildId, feedId);

      if (removed) {
        return interaction.reply(`🗑️ Successfully deleted feed \`${feedId}\`.`);
      } else {
        return interaction.reply({ content: `❌ Feed with ID \`${feedId}\` was not found.`, ephemeral: true });
      }
    }
  }
};
