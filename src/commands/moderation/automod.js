const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('🛡️ Configure automated moderation protection systems')
    .addSubcommand(sub =>
      sub
        .setName('antispam')
        .setDescription('Toggle Anti-Spam protection')
        .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable/Disable anti-spam').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('antilink')
        .setDescription('Toggle Anti-Invite / Anti-Link protection')
        .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable/Disable anti-link').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('badwords')
        .setDescription('Add or remove prohibited words from auto-delete filter')
        .addStringOption(opt =>
          opt
            .setName('action')
            .setDescription('Add or Remove words')
            .setRequired(true)
            .addChoices({ name: 'Add Word', value: 'add' }, { name: 'Remove Word', value: 'remove' }, { name: 'List Words', value: 'list' })
        )
        .addStringOption(opt => opt.setName('word').setDescription('Word to add/remove').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('status')
        .setDescription('View current AutoMod configuration status')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const settings = db.getGuildSettings(interaction.guildId);

    if (sub === 'antispam') {
      const enabled = interaction.options.getBoolean('enabled');
      settings.automod.antiSpam = enabled;
      db.updateGuildSettings(interaction.guildId, settings);
      return interaction.reply(`🛡️ Anti-Spam protection is now **${enabled ? 'ENABLED' : 'DISABLED'}**.`);
    }

    if (sub === 'antilink') {
      const enabled = interaction.options.getBoolean('enabled');
      settings.automod.antiLink = enabled;
      db.updateGuildSettings(interaction.guildId, settings);
      return interaction.reply(`🔗 Anti-Link protection is now **${enabled ? 'ENABLED' : 'DISABLED'}**.`);
    }

    if (sub === 'badwords') {
      const action = interaction.options.getString('action');
      const word = interaction.options.getString('word')?.toLowerCase().trim();

      if (action === 'list') {
        const words = settings.automod.badWords || [];
        return interaction.reply({
          content: words.length > 0 ? `🚫 **Filtered Words (${words.length}):**\n\`${words.join('`, `')}\`` : 'ℹ️ No filtered words configured.',
          ephemeral: true
        });
      }

      if (!word) {
        return interaction.reply({ content: '❌ You must specify a word to add or remove.', ephemeral: true });
      }

      if (action === 'add') {
        if (!settings.automod.badWords.includes(word)) {
          settings.automod.badWords.push(word);
          db.updateGuildSettings(interaction.guildId, settings);
          return interaction.reply(`✅ Added \`${word}\` to filtered words.`);
        }
        return interaction.reply({ content: `⚠️ \`${word}\` is already in the filter list.`, ephemeral: true });
      }

      if (action === 'remove') {
        settings.automod.badWords = settings.automod.badWords.filter(w => w !== word);
        db.updateGuildSettings(interaction.guildId, settings);
        return interaction.reply(`✅ Removed \`${word}\` from filtered words.`);
      }
    }

    if (sub === 'status') {
      const am = settings.automod;
      const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle('🛡️ AutoMod Configuration Status')
        .addFields(
          { name: 'Anti-Spam Filter', value: am.antiSpam ? '✅ Active' : '❌ Disabled', inline: true },
          { name: 'Anti-Link / Invite', value: am.antiLink ? '✅ Active' : '❌ Disabled', inline: true },
          { name: 'Anti-Ghost Ping', value: am.antiGhostPing ? '✅ Active' : '❌ Disabled', inline: true },
          { name: 'Max Mentions per Msg', value: `\`${am.maxMentions || 5}\``, inline: true },
          { name: 'Blacklisted Words', value: `\`${(am.badWords || []).length} words\``, inline: true }
        )
        .setFooter({ text: 'Configure with /automod antispam | antilink | badwords' });

      return interaction.reply({ embeds: [embed] });
    }
  }
};
