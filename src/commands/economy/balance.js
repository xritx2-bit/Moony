const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('💰 Check your or another member\'s coin balance')
    .addUserOption(opt => opt.setName('user').setDescription('Member to check').setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const userData = db.getUserData(interaction.guildId, targetUser.id);

    const embed = new EmbedBuilder()
      .setColor(colors.economy)
      .setTitle(`💰 ${targetUser.username}'s Bank & Wallet`)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { name: '💵 Wallet', value: `\`🪙 ${userData.balance?.toLocaleString() || 0} coins\``, inline: true },
        { name: '🏦 Bank', value: `\`🪙 ${userData.bank?.toLocaleString() || 0} coins\``, inline: true },
        { name: '💎 Net Worth', value: `\`🪙 ${((userData.balance || 0) + (userData.bank || 0)).toLocaleString()} coins\``, inline: true }
      )
      .setFooter({ text: 'Earn coins using /daily and /work!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
