const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('🎫 Deploy an interactive Ticket Support Panel with category buttons')
    .addChannelOption(opt =>
      opt
        .setName('channel')
        .setDescription('Channel to send the ticket panel in')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addChannelOption(opt =>
      opt
        .setName('category')
        .setDescription('Category channel where opened ticket channels will be created')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false)
    )
    .addRoleOption(opt =>
      opt
        .setName('staff_role')
        .setDescription('Role that has permission to view and claim tickets')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    const categoryChannel = interaction.options.getChannel('category');
    const staffRole = interaction.options.getRole('staff_role');

    const settings = db.getGuildSettings(interaction.guildId);
    if (categoryChannel) settings.tickets.categoryId = categoryChannel.id;
    if (staffRole) settings.tickets.staffRoleId = staffRole.id;
    db.updateGuildSettings(interaction.guildId, settings);

    const embed = new EmbedBuilder()
      .setColor(colors.ticket)
      .setTitle('🎫 Customer Support & Assistance Desk')
      .setDescription(
        `Welcome to the **${interaction.guild.name}** Support Center!\n\n` +
        `Need help with something? Click one of the buttons below to open a private ticket channel with our team.\n\n` +
        `**Available Categories:**\n` +
        `• 💬 **General Support** — Inquiries, questions, guidance\n` +
        `• 💳 **Billing & Store** — Purchases, perks, subscriptions\n` +
        `• 🐛 **Bug Reports** — Technical issues & exploits\n` +
        `• 🛡️ **Moderation & Reports** — Report a user or appeal an action`
      )
      .setFooter({ text: 'Moony Ticket System • One click ticket creation' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_open_General Support')
        .setLabel('General Support')
        .setEmoji('💬')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('ticket_open_Billing & Store')
        .setLabel('Billing & Store')
        .setEmoji('💳')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('ticket_open_Bug Report')
        .setLabel('Bug Report')
        .setEmoji('🐛')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('ticket_open_Moderation Report')
        .setLabel('Moderation / Report')
        .setEmoji('🛡️')
        .setStyle(ButtonStyle.Danger)
    );

    await targetChannel.send({ embeds: [embed], components: [row] });

    await interaction.reply({
      content: `✅ Ticket panel has been dispatched to <#${targetChannel.id}>!`,
      ephemeral: true
    });
  }
};
