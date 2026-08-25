const { EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const CanvasRank = require('../../utils/canvasRank');
const colors = require('../../utils/colors');
const Logger = require('../../utils/logger');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const guildId = member.guild.id;
    const settings = db.getGuildSettings(guildId);

    // 1. Auto-Role Assignment
    if (!member.user.bot && settings.welcome.autoRoleId) {
      const role = member.guild.roles.cache.get(settings.welcome.autoRoleId);
      if (role) {
        member.roles.add(role).catch(err => {
          Logger.warn(`Failed to assign auto-role ${role.name}:`, err.message);
        });
      }
    }

    if (member.user.bot && settings.welcome.botRoleId) {
      const botRole = member.guild.roles.cache.get(settings.welcome.botRoleId);
      if (botRole) {
        member.roles.add(botRole).catch(() => {});
      }
    }

    // 2. Welcome Announcement & Card
    if (settings.welcome.enabled && settings.welcome.channelId) {
      const channel = member.guild.channels.cache.get(settings.welcome.channelId);
      if (channel && channel.isTextBased()) {
        const welcomeAttachment = CanvasRank.createWelcomeAttachment(member, member.guild.memberCount);

        const welcomeText = (settings.welcome.message || 'Welcome {user} to **{server}**! We are now at **{memberCount}** members! 🎉')
          .replace('{user}', `<@${member.id}>`)
          .replace('{user.tag}', member.user.tag)
          .replace('{server}', member.guild.name)
          .replace('{memberCount}', member.guild.memberCount.toString());

        await channel.send({
          content: welcomeText,
          files: [welcomeAttachment]
        }).catch(err => {
          Logger.error('Failed to send welcome message:', err.message);
        });
      }
    }

    // 3. DM Welcome
    if (settings.welcome.dmWelcome && !member.user.bot) {
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(colors.primary)
          .setTitle(`🎉 Welcome to ${member.guild.name}!`)
          .setDescription(
            `Hey **${member.user.username}**, we are thrilled to have you in our community!\n\n` +
            `• Check out the server rules and channels.\n` +
            `• Use \`/help\` in the server to see all Moony SuperBot features!\n` +
            `• Join a voice channel and type \`/play\` to listen to Spotify music!`
          )
          .setThumbnail(member.guild.iconURL({ dynamic: true }) || undefined)
          .setTimestamp();

        await member.send({ embeds: [dmEmbed] });
      } catch (e) {}
    }
  }
};
