const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const StoreManager = require('../../utils/storeManager');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('store-claim')
    .setDescription('🛒 Link & open a pending Minecraft webstore ticket by Order ID')
    .addStringOption(opt =>
      opt.setName('order_id').setDescription('Your Order Reference ID (e.g. #MLX-212692 or MLX-212692)').setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const orderIdInput = interaction.options.getString('order_id');
    const order = db.getStoreOrder(orderIdInput);

    if (!order) {
      return interaction.editReply({
        content: `❌ Order reference \`${orderIdInput}\` could not be found. Please double-check your order ID from the webstore confirmation.`
      });
    }

    if (order.status === 'ticket_created' && order.ticketChannelId) {
      return interaction.editReply({
        content: `ℹ️ Ticket for order **${order.orderId}** is already open: <#${order.ticketChannelId}>`
      });
    }

    const settings = db.getGuildSettings(interaction.guildId);

    try {
      const ticketResult = await StoreManager.createStoreTicketChannel(
        interaction.client,
        interaction.guild,
        interaction.user,
        order,
        settings
      );

      db.updateStoreOrder(order.orderId, {
        status: 'ticket_created',
        ticketChannelId: ticketResult.channel.id,
        resolvedUserId: interaction.user.id
      });

      const embed = new EmbedBuilder()
        .setColor(colors.success)
        .setTitle('🌸 Store Ticket Activated!')
        .setDescription(`Your ticket for order **${order.orderId}** has been created in <#${ticketResult.channel.id}>!`);

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({
        content: `❌ Failed to create ticket: ${err.message}`
      });
    }
  }
};
