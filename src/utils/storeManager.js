const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const db = require('../database/db');
const colors = require('./colors');
const Logger = require('./logger');

class StoreManager {
  /**
   * Validate if a Discord input corresponds to a real Discord account,
   * and check if that account is a member of the guild.
   */
  static async validateDiscordUser(client, guild, discordInput) {
    if (!discordInput || typeof discordInput !== 'string') {
      return {
        isValid: false,
        user: null,
        inGuild: false,
        member: null,
        reason: 'No Discord username or ID provided'
      };
    }

    const cleaned = discordInput.replace(/<@!?(\d+)>/g, '$1').trim();

    // 1. If it's a numeric snowflake ID
    if (/^\d{17,20}$/.test(cleaned)) {
      try {
        let user = client.users.cache.get(cleaned);
        if (!user) {
          user = await client.users.fetch(cleaned).catch(() => null);
        }

        if (user) {
          let member = null;
          if (guild) {
            member = guild.members.cache.get(user.id) || null;
            if (!member) {
              member = await guild.members.fetch(user.id).catch(() => null);
            }
          }

          return {
            isValid: true,
            user,
            inGuild: !!member,
            member,
            tag: user.tag || user.username,
            id: user.id
          };
        }
      } catch (e) {
        Logger.warn(`Failed to fetch user by ID ${cleaned}:`, e.message);
      }
    }

    // 2. If it's a username / discriminator (e.g. rixieplayz#0001 or rixieplayz)
    const lowerInput = cleaned.toLowerCase();
    
    // Search cached users or guild members first
    if (guild) {
      const foundMember = guild.members.cache.find(m => {
        const username = m.user.username.toLowerCase();
        const tag = m.user.tag.toLowerCase();
        const displayName = m.displayName.toLowerCase();
        return username === lowerInput || tag === lowerInput || displayName === lowerInput;
      });

      if (foundMember) {
        return {
          isValid: true,
          user: foundMember.user,
          inGuild: true,
          member: foundMember,
          tag: foundMember.user.tag || foundMember.user.username,
          id: foundMember.user.id
        };
      }
    }

    // Search global client user cache
    const foundUser = client.users.cache.find(u => {
      return u.username.toLowerCase() === lowerInput || u.tag.toLowerCase() === lowerInput;
    });

    if (foundUser) {
      let member = null;
      if (guild) {
        member = guild.members.cache.get(foundUser.id) || null;
        if (!member) {
          member = await guild.members.fetch(foundUser.id).catch(() => null);
        }
      }

      return {
        isValid: true,
        user: foundUser,
        inGuild: !!member,
        member,
        tag: foundUser.tag || foundUser.username,
        id: foundUser.id
      };
    }

    return {
      isValid: false,
      user: null,
      inGuild: false,
      member: null,
      reason: `Could not verify "${discordInput}" as an authentic Discord user. Please provide a valid Discord ID or exact username.`
    };
  }

  /**
   * Get or create a permanent/long-lived invite link for the guild
   */
  static async getGuildInviteUrl(guild, settings) {
    if (settings.store?.inviteUrl) {
      return settings.store.inviteUrl;
    }

    try {
      // Find a suitable public text channel to create an invite
      const targetChannel = guild.rulesChannel || 
        guild.systemChannel || 
        guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.permissionsFor(guild.roles.everyone).has(PermissionFlagsBits.ViewChannel)) ||
        guild.channels.cache.find(c => c.type === ChannelType.GuildText);

      if (targetChannel) {
        const invite = await targetChannel.createInvite({
          maxAge: 0, // Never expires
          maxUses: 0,
          unique: false,
          reason: 'Moony Minecraft Webstore Automatic Discord Verification Invite'
        });
        return invite.url;
      }
    } catch (err) {
      Logger.warn('Could not generate automatic guild invite:', err.message);
    }

    return `https://discord.gg/`;
  }

  /**
   * Process a Web Store Order:
   * 1. Validate Discord account authenticity
   * 2. Check if in server
   * 3. If in server -> create ticket channel with rich order card
   * 4. If not in server -> send invite & queue pending ticket creation upon joining
   */
  static async processStoreOrder(client, guildId, orderData) {
    const guild = client.guilds.cache.get(guildId) || client.guilds.cache.first();
    if (!guild) {
      throw new Error('Target Discord server is not accessible by the bot.');
    }

    const settings = db.getGuildSettings(guild.id);
    const storeConfig = settings.store || {
      storeName: 'Melix MC Store',
      currency: 'INR',
      currencySymbol: '₹',
      paymentDetails: 'UPI (GPay / PhonePe / Paytm / BHIM QR)'
    };

    const orderId = orderData.orderId || `MLX-${Math.floor(100000 + Math.random() * 900000)}`;
    const formattedOrderId = orderId.startsWith('#') ? orderId : `#${orderId}`;
    const minecraftIgn = orderData.minecraftIgn || orderData.ign || 'Player';
    const discordInput = orderData.discordInput || orderData.discordId || orderData.discordTag || '';
    const paymentMethod = orderData.paymentMethod || storeConfig.paymentDetails || 'UPI (GPay / PhonePe / Paytm / BHIM QR)';
    const currencySymbol = storeConfig.currencySymbol || '₹';
    const totalAmount = orderData.totalAmount !== undefined ? orderData.totalAmount : (orderData.price || 99);
    
    // Normalize items
    let items = orderData.items || [];
    if (typeof items === 'string') {
      items = [{ name: items, price: totalAmount }];
    } else if (items.length === 0 && (orderData.itemName || orderData.rank)) {
      items = [{ name: orderData.itemName || orderData.rank || 'LEGEND RANK', price: totalAmount }];
    } else if (items.length === 0) {
      items = [{ name: 'LEGEND RANK', price: totalAmount }];
    }

    // 1. Authenticate Discord Account
    const authResult = await this.validateDiscordUser(client, guild, discordInput);
    const inviteUrl = await this.getGuildInviteUrl(guild, settings);

    const baseOrderRecord = {
      orderId: formattedOrderId,
      guildId: guild.id,
      minecraftIgn,
      discordInput,
      resolvedUserId: authResult.user ? authResult.user.id : null,
      discordTag: authResult.tag || discordInput,
      items,
      totalAmount,
      currency: storeConfig.currency || 'INR',
      currencySymbol,
      paymentMethod,
      storeName: storeConfig.storeName || 'Melix MC Store',
      createdAt: Date.now(),
      status: 'pending'
    };

    // Case A: Real Discord User & Currently in Server
    if (authResult.isValid && authResult.inGuild && authResult.user) {
      const ticketResult = await this.createStoreTicketChannel(
        client,
        guild,
        authResult.user,
        baseOrderRecord,
        settings
      );

      const savedOrder = db.saveStoreOrder({
        ...baseOrderRecord,
        status: 'ticket_created',
        ticketChannelId: ticketResult.channel.id,
        ticketUrl: `https://discord.com/channels/${guild.id}/${ticketResult.channel.id}`
      });

      return {
        success: true,
        status: 'ticket_created',
        order: savedOrder,
        channelId: ticketResult.channel.id,
        channelName: ticketResult.channel.name,
        discordUser: {
          id: authResult.user.id,
          tag: authResult.tag,
          inServer: true
        },
        message: `✅ Ticket #${ticketResult.channel.name} created automatically in Discord for ${authResult.tag}!`
      };
    }

    // Case B: Real Discord User BUT NOT in Server -> Send Invite & Queue
    if (authResult.isValid && !authResult.inGuild && authResult.user) {
      let dmSent = false;
      try {
        const inviteDmEmbed = new EmbedBuilder()
          .setColor(colors.primary)
          .setTitle(`🌸 ${storeConfig.storeName || 'Melix MC Store'} • Join Discord to Claim Your Order`)
          .setDescription(
            `Hello **${authResult.user.username}**!\n\n` +
            `We received your store order **${formattedOrderId}** for Minecraft IGN: **${minecraftIgn}**.\n\n` +
            `To complete payment and receive your perks, please **join our Discord server**:\n` +
            `👉 **[Click Here to Join Server](${inviteUrl})**\n\n` +
            `*As soon as you join, Moony will automatically open your private support ticket channel and notify server staff!*`
          )
          .setFooter({ text: 'Moony Store Integration • Automatic Ticket Delivery' })
          .setTimestamp();

        const dmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Join Discord Server')
            .setStyle(ButtonStyle.Link)
            .setURL(inviteUrl)
        );

        await authResult.user.send({ embeds: [inviteDmEmbed], components: [dmRow] });
        dmSent = true;
      } catch (dmErr) {
        Logger.warn(`Could not DM user ${authResult.user.id}:`, dmErr.message);
      }

      const savedOrder = db.saveStoreOrder({
        ...baseOrderRecord,
        status: 'pending_join',
        inviteUrl,
        dmSent
      });

      return {
        success: true,
        status: 'pending_join',
        order: savedOrder,
        inviteUrl,
        dmSent,
        discordUser: {
          id: authResult.user.id,
          tag: authResult.tag,
          inServer: false
        },
        message: `⚠️ Discord user verified but is not in the server yet. An invite has been generated. When ${authResult.tag} joins, Moony will instantly create their ticket!`
      };
    }

    // Case C: Unverified / Fake Discord Account
    const savedOrder = db.saveStoreOrder({
      ...baseOrderRecord,
      status: 'unverified_discord',
      error: authResult.reason || 'Could not verify authentic Discord user account'
    });

    return {
      success: false,
      status: 'unverified_discord',
      order: savedOrder,
      inviteUrl,
      error: authResult.reason || 'Provided Discord username/ID could not be verified as a real Discord account.',
      message: `❌ Discord account verification failed. Please ensure the customer provides an authentic Discord ID or Tag.`
    };
  }

  /**
   * Create the exact Rich Store Order Ticket Channel & Embed as shown in Image 1
   */
  static async createStoreTicketChannel(client, guild, user, order, settings) {
    const rawUsername = (user.username || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
    const orderSuffix = order.orderId.replace(/[^0-9]/g, '').slice(-4) || Math.floor(1000 + Math.random() * 9000);
    const channelName = `ticket-${rawUsername}-${orderSuffix}`;

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
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.EmbedLinks
        ]
      },
      {
        id: client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles
        ]
      }
    ];

    const staffRoleId = settings.store?.staffRoleId || settings.tickets?.staffRoleId;
    if (staffRoleId && guild.roles.cache.has(staffRoleId)) {
      permissionOverwrites.push({
        id: staffRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.EmbedLinks
        ]
      });
    }

    const categoryId = settings.store?.categoryId || settings.tickets?.categoryId;

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: (categoryId && guild.channels.cache.has(categoryId)) ? categoryId : null,
      topic: `Store Order Ticket • Bot Moony | Order ${order.orderId} | IGN: ${order.minecraftIgn}`,
      permissionOverwrites
    });

    // Register ticket in DB
    db.createTicket(guild.id, ticketChannel.id, user.id, 'Minecraft Store Order');

    // Build the exact text and embed structure from Image 1
    const storeName = order.storeName || settings.store?.storeName || 'Melix MC Store';
    const itemsSummary = order.items.map(i => `• ${i.name} (${order.currencySymbol}${i.price})`).join('\n');
    const itemsEmbedList = order.items.map(i => `• **${i.name}** - \`${order.currencySymbol}${i.price}\``).join('\n');

    const messageHeader =
      `🌸 **Welcome to your ${storeName} Ticket!**\n\n` +
      `Hello <@${user.id}>, your purchase request for **${order.minecraftIgn}** has been registered.\n\n` +
      `**Order Summary:**\n` +
      `${itemsSummary}\n` +
      `**Total Amount:** ${order.currencySymbol}${order.totalAmount}\n` +
      `**Payment Method:** ${order.paymentMethod}\n\n` +
      `A server staff member has been alerted and will provide the UPI QR / Bank transfer details to fulfill your order in-game!`;

    const orderCardEmbed = new EmbedBuilder()
      .setColor(0xF472B6) // Cherry blossom pink matching Image 1 🌸
      .setTitle(`🌸 Order Reference ${order.orderId}`)
      .setDescription(`Status: **Ticket Active** 🟢`)
      .addFields(
        {
          name: 'MINECRAFT IGN:',
          value: `\`${order.minecraftIgn}\``,
          inline: true
        },
        {
          name: 'DISCORD USER:',
          value: `\`${user.tag || user.username}\` (<@${user.id}>)`,
          inline: true
        },
        {
          name: 'PURCHASED ITEMS:',
          value: itemsEmbedList || `• ${order.items[0]?.name || 'LEGEND RANK'} - ${order.currencySymbol}${order.totalAmount}`,
          inline: false
        },
        {
          name: `Total Due (${order.paymentMethod}):`,
          value: `**${order.currencySymbol}${order.totalAmount} ${order.currency}**`,
          inline: false
        }
      )
      .setFooter({ text: `Moony Store Automation • ${storeName}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_claim')
        .setLabel('Claim Ticket')
        .setEmoji('🙋')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`ticket_order_fulfill_${order.orderId}`)
        .setLabel('Mark Paid & Delivered')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success),
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

    const staffPing = staffRoleId ? `<@&${staffRoleId}>` : '';
    await ticketChannel.send({
      content: `<@${user.id}> ${staffPing}`,
      embeds: [orderCardEmbed],
      components: [row]
    });

    // Send the welcoming message above the embed
    await ticketChannel.send({
      content: messageHeader
    });

    return { channel: ticketChannel };
  }

  /**
   * Called when a member joins the guild (guildMemberAdd).
   * Checks if there are any pending orders waiting for this member!
   */
  static async processPendingOrdersForMember(member) {
    try {
      const guild = member.guild;
      const settings = db.getGuildSettings(guild.id);
      const pendingOrders = db.getPendingStoreOrdersForUser(guild.id, member.user.id, member.user.username);

      if (pendingOrders.length === 0) return;

      Logger.info(`Found ${pendingOrders.length} pending store order(s) for joined member ${member.user.tag}`);

      for (const order of pendingOrders) {
        try {
          const result = await this.createStoreTicketChannel(
            member.client,
            guild,
            member.user,
            order,
            settings
          );

          db.updateStoreOrder(order.orderId, {
            status: 'ticket_created',
            ticketChannelId: result.channel.id,
            resolvedUserId: member.user.id,
            joinedAt: Date.now()
          });

          // Send welcome notice in DM or ticket
          try {
            await member.send({
              content: `🌸 Welcome to **${guild.name}**! Your order ticket **${order.orderId}** has been automatically created: <#${result.channel.id}>`
            });
          } catch (e) {}

          Logger.success(`Successfully activated pending order ${order.orderId} for ${member.user.tag} in #${result.channel.name}`);
        } catch (err) {
          Logger.error(`Error activating order ${order.orderId} on member join:`, err.message);
        }
      }
    } catch (e) {
      Logger.error('Error in processPendingOrdersForMember:', e.message);
    }
  }
}

module.exports = StoreManager;
