const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

const DAILY_REWARD = 250;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('🎁 Claim your daily reward of 250 coins'),

  async execute(interaction) {
    const userData = db.getUserData(interaction.guildId, interaction.user.id);
    const now = Date.now();
    const lastDaily = userData.lastDaily || 0;

    if (now - lastDaily < COOLDOWN_MS) {
      const nextTime = Math.floor((lastDaily + COOLDOWN_MS) / 1000);
      return interaction.reply({
        content: `⏳ You have already claimed your daily reward! Come back <t:${nextTime}:R>.`,
        ephemeral: true
      });
    }

    userData.balance = (userData.balance || 0) + DAILY_REWARD;
    userData.lastDaily = now;
    db.updateUserEconomy(interaction.guildId, interaction.user.id, userData);

    const embed = new EmbedBuilder()
      .setColor(colors.economy)
      .setTitle('🎁 Daily Reward Claimed!')
      .setDescription(`You received **🪙 ${DAILY_REWARD} coins**!`)
      .addFields(
        { name: 'New Wallet Balance', value: `\`🪙 ${userData.balance.toLocaleString()} coins\``, inline: true }
      )
      .setFooter({ text: 'Claim again tomorrow for more free coins!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
