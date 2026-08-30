const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const db = require('../database/db');
const colors = require('../utils/colors');
const Logger = require('../utils/logger');

class ButtonHandler {
  static async handle(interaction) {
    const { customId, guild, member, user, channel } = interaction;

    // ==========================================
    // 1. TICKETING SYSTEM BUTTONS
    // ==========================================
    if (customId.startsWith('ticket_open_')) {
      const category = customId.replace('ticket_open_', '');
      await this.handleTicketCreate(interaction, category);
      return;
    }

    if (customId === 'ticket_close') {
      const ticket = db.getTicket(channel.id);
      if (!ticket) {
        return interaction.reply({ content: '❌ This is not an active ticket channel.', ephemeral: true });
      }

      await interaction.reply('🔒 Closing ticket in 5 seconds...');
      db.closeTicket(channel.id, user.id);

      // Log closure
      await Logger.sendModLog(
        guild,
        'Ticket Closed',
        `Ticket **#${channel.name}** was closed by <@${user.id}>.`,
        [
          { name: 'Opened By', value: `<@${ticket.userId}>`, inline: true },
          { name: 'Closed By', value: `<@${user.id}>`, inline: true },
          { name: 'Category', value: ticket.category, inline: true }
        ],
        colors.warning
      );

      setTimeout(() => {
        channel.delete().catch(() => {});
      }, 5000);
      return;
    }

    if (customId === 'ticket_claim') {
      const ticket = db.getTicket(channel.id);
      if (!ticket) return interaction.reply({ content: '❌ Ticket not found.', ephemeral: true });

      if (ticket.claimedBy) {
        return interaction.reply({ content: `⚠️ This ticket is already claimed by <@${ticket.claimedBy}>!`, ephemeral: true });
      }

      db.claimTicket(channel.id, user.id);
      const claimEmbed = new EmbedBuilder()
        .setColor(colors.success)
        .setDescription(`🙋 **Ticket Claimed!** <@${user.id}> is now assisting you.`);

      await interaction.reply({ embeds: [claimEmbed] });
      return;
    }

    if (customId.startsWith('ticket_order_fulfill')) {
      const isStaff = member.permissions.has(PermissionFlagsBits.ManageMessages) ||
        member.permissions.has(PermissionFlagsBits.Administrator) ||
        member.roles.cache.some(r => r.name.toLowerCase().includes('staff') || r.name.toLowerCase().includes('admin') || r.name.toLowerCase().includes('mod'));

      if (!isStaff) {
        return interaction.reply({
          content: '❌ Only staff members can mark this store order as paid and fulfilled.',
          ephemeral: true
        });
      }

      const orderId = customId.replace('ticket_order_fulfill_', '');
      const order = db.getStoreOrder(orderId);

      if (order) {
        db.updateStoreOrder(order.orderId, {
          status: 'completed',
          fulfilledBy: user.id,
          fulfilledAt: Date.now()
        });
      }

      const fulfillEmbed = new EmbedBuilder()
        .setColor(colors.success)
        .setTitle('✅ Store Order Completed & Delivered!')
        .setDescription(
          `This purchase order has been **verified, paid, and fulfilled in-game** by <@${user.id}>!\n\n` +
          `• **Order Reference:** \`${order ? order.orderId : orderId}\`\n` +
          `• **Minecraft IGN:** \`${order ? order.minecraftIgn : 'Customer'}\`\n` +
          `• **Staff Assigned:** <@${user.id}>\n\n` +
          `*Thank you for supporting the server! Enjoy your in-game perks.*`
        )
        .setTimestamp();

      await interaction.reply({ embeds: [fulfillEmbed] });
      return;
    }

    if (customId === 'ticket_transcript') {
      await interaction.deferReply({ ephemeral: true });
      const messages = await channel.messages.fetch({ limit: 100 });
      const transcript = messages
        .reverse()
        .map(m => `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.cleanContent}`)
        .join('\n');

      const buffer = Buffer.from(transcript, 'utf8');
      await interaction.editReply({
        content: `📄 Here is the transcript for **#${channel.name}**:`,
        files: [{ attachment: buffer, name: `${channel.name}-transcript.txt` }]
      });
      return;
    }

    // ==========================================
    // 3. REACTION / BUTTON ROLES
    // ==========================================
    if (customId.startsWith('rr_role_')) {
      const roleId = customId.replace('rr_role_', '');
      const role = guild.roles.cache.get(roleId);
      if (!role) return interaction.reply({ content: '❌ Role not found on this server.', ephemeral: true });

      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(roleId);
        await interaction.reply({ content: `➖ Removed role **${role.name}** from you.`, ephemeral: true });
      } else {
        await member.roles.add(roleId);
        await interaction.reply({ content: `➕ Granted role **${role.name}** to you!`, ephemeral: true });
      }
    }
  }

  static async handleTicketCreate(interaction, category) {
    const { guild, user, member } = interaction;
    const settings = db.getGuildSettings(guild.id);

    // Check if user already has an open ticket in this category
    const existing = Object.values(db.data.tickets).find(
      t => t.guildId === guild.id && t.userId === user.id && t.status === 'open'
    );
    if (existing) {
      const exChannel = guild.channels.cache.get(existing.channelId);
      if (exChannel) {
        return interaction.reply({
          content: `⚠️ You already have an open ticket: <#${existing.channelId}>`,
          ephemeral: true
        });
      }
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const channelName = `ticket-${user.username.slice(0, 15)}-${Math.floor(100 + Math.random() * 900)}`;
      const permissionOverwrites = [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ReadMessageHistory
          ]
        },
        {
          id: interaction.client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.EmbedLinks
          ]
        }
      ];

      if (settings.tickets.staffRoleId) {
        permissionOverwrites.push({
          id: settings.tickets.staffRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ReadMessageHistory
          ]
        });
      }

      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: settings.tickets.categoryId || null,
        permissionOverwrites
      });

      db.createTicket(guild.id, ticketChannel.id, user.id, category);

      // Ticket welcome panel
      const ticketEmbed = new EmbedBuilder()
        .setColor(colors.ticket)
        .setTitle(`🎫 Ticket: ${category}`)
        .setDescription(
          `Hello <@${user.id}>! Thank you for reaching out.\n\n` +
          `Please describe your issue or inquiry in detail and our support team will assist you shortly.\n\n` +
          `• **Category:** ${category}\n` +
          `• **Created:** <t:${Math.floor(Date.now() / 1000)}:R>`
        )
        .setFooter({ text: 'Use the buttons below to manage this ticket' });

      const ticketRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_claim')
          .setLabel('Claim Ticket')
          .setEmoji('🙋')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('ticket_transcript')
          .setLabel('Transcript')
          .setEmoji('📄')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Close Ticket')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({
        content: `<@${user.id}> ${settings.tickets.staffRoleId ? `<@&${settings.tickets.staffRoleId}>` : ''}`,
        embeds: [ticketEmbed],
        components: [ticketRow]
      });

      await interaction.editReply({
        content: `✅ Your ticket has been created: <#${ticketChannel.id}>`
      });
    } catch (err) {
      Logger.error('Failed to create ticket channel:', err.message);
      await interaction.editReply({
        content: `❌ Failed to create ticket channel: ${err.message}`
      });
    }
  }
}

module.exports = ButtonHandler;
