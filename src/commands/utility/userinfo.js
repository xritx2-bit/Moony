const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('👤 View detailed profile and metadata for a member')
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    const userData = db.getUserData(interaction.guildId, targetUser.id);
    const rank = db.getUserRank(interaction.guildId, targetUser.id);

    const roles = member
      ? member.roles.cache
          .filter(r => r.id !== interaction.guildId)
          .sort((a, b) => b.position - a.position)
          .map(r => `<@&${r.id}>`)
          .slice(0, 10)
          .join(', ') || 'No roles'
      : 'Not in server';

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor && member.displayHexColor !== '#000000' ? member.displayHexColor : colors.primary)
      .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL() })
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: '🆔 User ID', value: `\`${targetUser.id}\``, inline: true },
        { name: '🤖 Bot Account', value: targetUser.bot ? 'Yes' : 'No', inline: true },
        { name: '📅 Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:D> (<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>)`, inline: false },
        { name: '📥 Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)` : 'N/A', inline: false },
        { name: '✨ Level & Rank', value: `Level **${userData.level}** • Rank **#${rank}** (\`${userData.xp.toLocaleString()} XP\`)`, inline: true },
        { name: '💰 Wallet Coins', value: `\`🪙 ${userData.balance?.toLocaleString() || 0}\``, inline: true },
        { name: '🎭 Top Roles', value: roles, inline: false }
      )
      .setFooter({ text: 'Moony User Profile' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
