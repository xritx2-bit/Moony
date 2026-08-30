const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('⚙️ View the all-in-one configuration summary and quick setup guide')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const settings = db.getGuildSettings(interaction.guildId);

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle(`⚙️ Moony Server Configuration • ${interaction.guild.name}`)
      .setDescription(
        `Here is the active configuration for your server. Use the designated commands to adjust each module.`
      )
      .addFields(
        {
          name: '👋 Welcome & Goodbye',
          value:
            `• **Welcome:** ${settings.welcome.enabled ? `✅ Active in <#${settings.welcome.channelId}>` : '❌ Disabled'}\n` +
            `• **Auto Role:** ${settings.welcome.autoRoleId ? `<@&${settings.welcome.autoRoleId}>` : 'None'}\n` +
            `• **Goodbye:** ${settings.goodbye.enabled ? `✅ Active in <#${settings.goodbye.channelId}>` : '❌ Disabled'}\n` +
            `*Configure:* \`/setwelcome\` and \`/setgoodbye\``,
          inline: false
        },
        {
          name: '🛡️ Moderation & Audit Log',
          value:
            `• **Mod Log:** ${settings.modLogChannel ? `<#${settings.modLogChannel}>` : 'Not set'}\n` +
            `• **Anti-Spam:** ${settings.automod.antiSpam ? '✅' : '❌'} | **Anti-Link:** ${settings.automod.antiLink ? '✅' : '❌'}\n` +
            `*Configure:* \`/setmodlog\` and \`/automod\``,
          inline: false
        },
        {
          name: '✨ Leveling & Gamification',
          value:
            `• **Status:** ${settings.leveling.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
            `• **Announcement Channel:** ${settings.leveling.channelId ? (settings.leveling.channelId === 'dm' ? '📨 Direct Messages' : settings.leveling.channelId === 'none' ? '🤫 Silent' : `<#${settings.leveling.channelId}>`) : '💬 Current Channel'}\n` +
            `• **Role Rewards:** \`${Object.keys(settings.leveling.roleRewards || {}).length} configured\`\n` +
            `*Configure:* \`/setlevelchannel\`, \`/rolereward\` and \`/rank\``,
          inline: false
        },
        {
          name: '🎫 Ticketing Support',
          value:
            `• **Category:** ${settings.tickets.categoryId ? `<#${settings.tickets.categoryId}>` : 'Default'}\n` +
            `• **Staff Role:** ${settings.tickets.staffRoleId ? `<@&${settings.tickets.staffRoleId}>` : 'None'}\n` +
            `*Configure:* \`/ticket-panel\``,
          inline: false
        },
        {
          name: '🛒 Minecraft Web Store & Tickets',
          value:
            `• **Store Name:** \`${settings.store?.storeName || 'Melix MC Store'}\`\n` +
            `• **Currency:** \`${settings.store?.currencySymbol || '₹'} (${settings.store?.currency || 'INR'})\`\n` +
            `• **Staff Role:** ${settings.store?.staffRoleId ? `<@&${settings.store.staffRoleId}>` : 'Default Staff'}\n` +
            `• **Webhook:** \`POST /api/store/webhook\`\n` +
            `*Configure:* \`/store-setup\` and \`/store-order\``,
          inline: false
        }
      )
      .setFooter({ text: 'Moony Administration Suite • Built for precision' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
