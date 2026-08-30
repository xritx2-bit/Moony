const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('store-setup')
    .setDescription('🛒 Configure Minecraft Web Store integration, ticket category & staff role')
    .addStringOption(opt =>
      opt.setName('store_name').setDescription('Name of your Minecraft Store (e.g. Melix MC Store)').setRequired(false)
    )
    .addChannelOption(opt =>
      opt
        .setName('ticket_category')
        .setDescription('Category where store purchase tickets will be created')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false)
    )
    .addRoleOption(opt =>
      opt.setName('staff_role').setDescription('Role pinged and granted access to store tickets').setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('currency_symbol').setDescription('Currency symbol (e.g. ₹ or $ or €)').setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('payment_method').setDescription('Default payment method details (e.g. UPI (GPay/PhonePe/Paytm/BHIM QR))').setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('invite_url').setDescription('Custom permanent Discord server invite URL for buyers').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const settings = db.getGuildSettings(interaction.guildId);
    if (!settings.store) {
      settings.store = {
        enabled: true,
        storeName: 'Melix MC Store',
        currency: 'INR',
        currencySymbol: '₹',
        staffRoleId: null,
        categoryId: null,
        logChannelId: null,
        inviteUrl: null,
        webhookSecret: 'moony_store_secret',
        paymentDetails: 'UPI (GPay / PhonePe / Paytm / BHIM QR)'
      };
    }

    const storeName = interaction.options.getString('store_name');
    const category = interaction.options.getChannel('ticket_category');
    const staffRole = interaction.options.getRole('staff_role');
    const currencySymbol = interaction.options.getString('currency_symbol');
    const paymentMethod = interaction.options.getString('payment_method');
    const inviteUrl = interaction.options.getString('invite_url');

    let changed = false;
    if (storeName) { settings.store.storeName = storeName; changed = true; }
    if (category) { settings.store.categoryId = category.id; changed = true; }
    if (staffRole) { settings.store.staffRoleId = staffRole.id; changed = true; }
    if (currencySymbol) { settings.store.currencySymbol = currencySymbol; changed = true; }
    if (paymentMethod) { settings.store.paymentDetails = paymentMethod; changed = true; }
    if (inviteUrl) { settings.store.inviteUrl = inviteUrl; changed = true; }

    if (changed) {
      db.updateGuildSettings(interaction.guildId, settings);
    }

    const embed = new EmbedBuilder()
      .setColor(0xF472B6)
      .setTitle(`🌸 ${settings.store.storeName || 'Melix MC Store'} • Configuration`)
      .setDescription('Minecraft Web Store & Discord Ticket Integration status:')
      .addFields(
        {
          name: '🏷️ Store Name',
          value: `\`${settings.store.storeName || 'Melix MC Store'}\``,
          inline: true
        },
        {
          name: '💰 Currency & Symbol',
          value: `\`${settings.store.currencySymbol || '₹'} (${settings.store.currency || 'INR'})\``,
          inline: true
        },
        {
          name: '🛡️ Store Staff Role',
          value: settings.store.staffRoleId ? `<@&${settings.store.staffRoleId}>` : 'Not set (Admin default)',
          inline: true
        },
        {
          name: '📁 Ticket Category',
          value: settings.store.categoryId ? `<#${settings.store.categoryId}>` : 'Server Root',
          inline: true
        },
        {
          name: '💳 Payment Method Details',
          value: `\`${settings.store.paymentDetails || 'UPI (GPay / PhonePe / Paytm / BHIM QR)'}\``,
          inline: true
        },
        {
          name: '🔗 Server Invite Link',
          value: settings.store.inviteUrl ? `[Custom Invite](${settings.store.inviteUrl})` : 'Auto-generated on checkout',
          inline: true
        },
        {
          name: '🌐 Webhook Endpoint URL',
          value: '`POST /api/store/webhook`\nUse this in Tebex, CraftingStore, Buycraft, WooCommerce or custom stores.',
          inline: false
        }
      )
      .setFooter({ text: 'Moony Minecraft Web Store Automation Suite' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
