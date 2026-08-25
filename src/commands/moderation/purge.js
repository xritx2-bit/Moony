const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Logger = require('../../utils/logger');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('🧹 Bulk delete messages in the current channel with optional filter')
    .addIntegerOption(opt =>
      opt
        .setName('amount')
        .setDescription('Number of messages to check/delete (1 to 100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addUserOption(opt =>
      opt
        .setName('user')
        .setDescription('Only delete messages sent by this specific user')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt
        .setName('filter')
        .setDescription('Optional message type filter')
        .setRequired(false)
        .addChoices(
          { name: '🤖 Bot Messages Only', value: 'bots' },
          { name: '🔗 Messages with Links', value: 'links' },
          { name: '📎 Messages with Attachments/Images', value: 'attachments' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');
    const filter = interaction.options.getString('filter');

    await interaction.deferReply({ ephemeral: true });

    try {
      const messages = await interaction.channel.messages.fetch({ limit: amount });
      let toDelete = messages;

      if (targetUser) {
        toDelete = toDelete.filter(m => m.author.id === targetUser.id);
      }

      if (filter === 'bots') {
        toDelete = toDelete.filter(m => m.author.bot);
      } else if (filter === 'links') {
        toDelete = toDelete.filter(m => /https?:\/\//i.test(m.content));
      } else if (filter === 'attachments') {
        toDelete = toDelete.filter(m => m.attachments.size > 0);
      }

      // Filter out messages older than 14 days (Discord limitation)
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const validMessages = toDelete.filter(m => m.createdTimestamp > twoWeeksAgo);

      if (validMessages.size === 0) {
        return interaction.editReply({
          content: '⚠️ No matching messages found (or all matching messages are older than 14 days).'
        });
      }

      const deleted = await interaction.channel.bulkDelete(validMessages, true);

      await interaction.editReply({
        content: `🧹 Successfully purged **${deleted.size} messages**!`
      });

      await Logger.sendModLog(
        interaction.guild,
        'Messages Purged',
        `<@${interaction.user.id}> purged **${deleted.size} messages** in <#${interaction.channel.id}>.`,
        [
          { name: 'Channel', value: `<#${interaction.channel.id}>`, inline: true },
          { name: 'Target User', value: targetUser ? `<@${targetUser.id}>` : 'All', inline: true },
          { name: 'Filter', value: filter || 'None', inline: true }
        ],
        colors.info
      );
    } catch (err) {
      Logger.error('Purge error:', err.message);
      await interaction.editReply({ content: `❌ Error purging messages: ${err.message}` });
    }
  }
};
