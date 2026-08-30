const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const StoreManager = require('../../utils/storeManager');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('store-order')
    .setDescription('🛒 Create or simulate a Minecraft Web Store order ticket with Discord verification')
    .addStringOption(opt =>
      opt.setName('ign').setDescription('Customer Minecraft In-Game Name (IGN)').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('discord_user').setDescription('Discord User ID or @Username of the customer').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('item').setDescription('Item / Rank purchased (e.g. LEGEND RANK)').setRequired(true)
    )
    .addNumberOption(opt =>
      opt.setName('price').setDescription('Total price amount (e.g. 99)').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('payment_method').setDescription('Payment method (e.g. UPI (GPay / PhonePe / Paytm / BHIM QR))').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    await interaction.deferReply();

    const ign = interaction.options.getString('ign');
    const discordUser = interaction.options.getString('discord_user');
    const item = interaction.options.getString('item');
    const price = interaction.options.getNumber('price');
    const paymentMethod = interaction.options.getString('payment_method');

    try {
      const result = await StoreManager.processStoreOrder(interaction.client, interaction.guildId, {
        minecraftIgn: ign,
        discordInput: discordUser,
        itemName: item,
        totalAmount: price,
        paymentMethod: paymentMethod || undefined
      });

      if (result.status === 'ticket_created') {
        const embed = new EmbedBuilder()
          .setColor(colors.success)
          .setTitle('🌸 Store Order Ticket Opened!')
          .setDescription(
            `Order **${result.order.orderId}** has been verified and opened in <#${result.channelId}> for <@${result.discordUser.id}>!\n\n` +
            `• **Minecraft IGN:** \`${ign}\`\n` +
            `• **Item:** \`${item}\` (₹${price})\n` +
            `• **Channel:** <#${result.channelId}>`
          )
          .setFooter({ text: 'Customer and staff have been pinged in the ticket' });

        return interaction.editReply({ embeds: [embed] });
      }

      if (result.status === 'pending_join') {
        const embed = new EmbedBuilder()
          .setColor(colors.warning)
          .setTitle('⚠️ Customer Not in Discord Server - Invite Dispatched')
          .setDescription(
            `Discord user <@${result.discordUser.id}> (\`${result.discordUser.tag}\`) was verified as a real account, but is **not currently in this Discord server**.\n\n` +
            `📩 **Action Taken:**\n` +
            `• An automated invite link was sent via DM to <@${result.discordUser.id}>: **[Join Server](${result.inviteUrl})**\n` +
            `• When they join the server, Moony will automatically create their private store ticket channel and ping staff!`
          )
          .setFooter({ text: `Order ${result.order.orderId} is stored in pending queue` });

        return interaction.editReply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setColor(colors.danger)
        .setTitle('❌ Discord Verification Failed')
        .setDescription(`Could not find a valid Discord account for \`${discordUser}\`.\n\n${result.error || 'Please provide a valid numeric Discord ID or exact username.'}`);

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return interaction.editReply({
        content: `❌ Failed to process store order: ${err.message}`
      });
    }
  }
};
