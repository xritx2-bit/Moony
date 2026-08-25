const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('💸 Transfer coins from your wallet to another member')
    .addUserOption(opt => opt.setName('user').setDescription('Recipient member').setRequired(true))
    .addIntegerOption(opt =>
      opt
        .setName('amount')
        .setDescription('Amount of coins to send')
        .setMinValue(1)
        .setRequired(true)
    ),

  async execute(interaction) {
    const recipient = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (recipient.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot transfer coins to yourself.', ephemeral: true });
    }

    if (recipient.bot) {
      return interaction.reply({ content: '❌ You cannot transfer coins to bots.', ephemeral: true });
    }

    const senderData = db.getUserData(interaction.guildId, interaction.user.id);
    if ((senderData.balance || 0) < amount) {
      return interaction.reply({
        content: `❌ Insufficient balance. You only have **🪙 ${senderData.balance || 0} coins** in your wallet.`,
        ephemeral: true
      });
    }

    const recipientData = db.getUserData(interaction.guildId, recipient.id);

    senderData.balance -= amount;
    recipientData.balance = (recipientData.balance || 0) + amount;

    db.updateUserEconomy(interaction.guildId, interaction.user.id, senderData);
    db.updateUserEconomy(interaction.guildId, recipient.id, recipientData);

    const embed = new EmbedBuilder()
      .setColor(colors.economy)
      .setTitle('💸 Coins Transferred!')
      .setDescription(`<@${interaction.user.id}> transferred **🪙 ${amount.toLocaleString()} coins** to <@${recipient.id}>.`)
      .addFields(
        { name: 'Your New Balance', value: `\`🪙 ${senderData.balance.toLocaleString()}\``, inline: true },
        { name: `${recipient.username}'s Balance`, value: `\`🪙 ${recipientData.balance.toLocaleString()}\``, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
