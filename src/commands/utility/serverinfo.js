const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('🏰 View detailed overview and metrics for this server'),

  async execute(interaction) {
    const guild = interaction.guild;
    await guild.fetch();

    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
    const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
    const rolesCount = guild.roles.cache.size;
    const emojisCount = guild.emojis.cache.size;

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle(`🏰 ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: '👑 Server Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: '🆔 Server ID', value: `\`${guild.id}\``, inline: true },
        { name: '📅 Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`, inline: true },
        { name: '👥 Members', value: `\`${guild.memberCount.toLocaleString()}\``, inline: true },
        { name: '💬 Channels', value: `\`${textChannels} Text | ${voiceChannels} Voice | ${categories} Categories\``, inline: true },
        { name: '🎭 Roles / Emojis', value: `\`${rolesCount} Roles | ${emojisCount} Emojis\``, inline: true },
        { name: '🚀 Boost Tier', value: `\`Tier ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} Boosts)\``, inline: true },
        { name: '🔒 Verification Level', value: `\`${guild.verificationLevel}\``, inline: true }
      )
      .setFooter({ text: 'Moony Server Analytics' })
      .setTimestamp();

    if (guild.bannerURL()) {
      embed.setImage(guild.bannerURL({ size: 1024 }));
    }

    await interaction.reply({ embeds: [embed] });
  }
};
