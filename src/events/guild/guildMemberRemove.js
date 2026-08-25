const { EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    const settings = db.getGuildSettings(member.guild.id);

    if (settings.goodbye?.enabled && settings.goodbye?.channelId) {
      const channel = member.guild.channels.cache.get(settings.goodbye.channelId);
      if (channel && channel.isTextBased()) {
        const text = (settings.goodbye.message || '{user.tag} has left **{server}**. We will miss you! 👋')
          .replace('{user}', member.user.username)
          .replace('{user.tag}', member.user.tag)
          .replace('{server}', member.guild.name)
          .replace('{memberCount}', member.guild.memberCount.toString());

        const embed = new EmbedBuilder()
          .setColor(colors.danger)
          .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
          .setDescription(text)
          .setFooter({ text: `Member #${member.guild.memberCount}` })
          .setTimestamp();

        await channel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  }
};
