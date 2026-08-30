const express = require('express');
const path = require('path');
const os = require('os');
const db = require('../database/db');
const Logger = require('../utils/logger');
const StoreManager = require('../utils/storeManager');

function startDashboard(client, port = 3000) {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));

  // Helper to get active guild
  const getTargetGuild = (guildId = null) => {
    if (guildId) return client.guilds.cache.get(guildId) || null;
    return client.guilds.cache.first() || null;
  };

  // REST API: Live Bot Stats & Diagnostics
  app.get('/api/stats', (req, res) => {
    try {
      const uptimeSec = Math.floor(process.uptime());
      const days = Math.floor(uptimeSec / 86400);
      const hours = Math.floor((uptimeSec % 86400) / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);

      const totalOrdersCount = Object.keys(db.data.storeOrders || {}).length;

      res.json({
        botName: client.user?.username || 'Moony',
        botAvatar: client.user?.displayAvatarURL() || null,
        botId: client.user?.id || null,
        ping: Math.round(client.ws?.ping || 0),
        guildCount: client.guilds.cache.size,
        userCount: client.users.cache.size,
        commandCount: client.commands ? client.commands.size : 0,
        totalStoreOrders: totalOrdersCount,
        uptime: `${days}d ${hours}h ${minutes}m`,
        uptimeSeconds: uptimeSec,
        memoryUsageMb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1),
        systemOs: `${os.type()} ${os.arch()}`,
        nodeVersion: process.version
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // REST API: Verify Real Discord Account & Server Presence
  app.get('/api/store/verify-discord', async (req, res) => {
    try {
      const discordInput = req.query.discordInput || req.query.user || '';
      const guildId = req.query.guildId || null;
      const guild = getTargetGuild(guildId);

      const auth = await StoreManager.validateDiscordUser(client, guild, discordInput);
      res.json({
        isValid: auth.isValid,
        inGuild: auth.inGuild,
        tag: auth.tag || null,
        id: auth.id || null,
        avatar: auth.user ? auth.user.displayAvatarURL({ extension: 'png', size: 128 }) : null,
        username: auth.user ? auth.user.username : null,
        displayName: auth.member ? auth.member.displayName : (auth.user ? auth.user.username : null),
        reason: auth.reason || null
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // REST API: Get Web Store Orders
  app.get('/api/store/orders', (req, res) => {
    try {
      const guildId = req.query.guildId || null;
      const orders = db.getStoreOrders(guildId);
      res.json({ orders });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // REST API: Get Store Settings
  app.get('/api/store/settings', (req, res) => {
    try {
      const guild = getTargetGuild(req.query.guildId);
      const settings = guild ? db.getGuildSettings(guild.id) : { store: {} };
      res.json({
        guildId: guild ? guild.id : null,
        guildName: guild ? guild.name : 'Moony Guild',
        store: settings.store || {
          enabled: true,
          storeName: 'Melix MC Store',
          currency: 'INR',
          currencySymbol: '₹',
          staffRoleId: null,
          categoryId: null,
          inviteUrl: null,
          paymentDetails: 'UPI (GPay / PhonePe / Paytm / BHIM QR)'
        }
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // REST API: Update Store Settings
  app.post('/api/store/settings', (req, res) => {
    try {
      const guild = getTargetGuild(req.body.guildId);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      const settings = db.getGuildSettings(guild.id);
      settings.store = {
        ...settings.store,
        ...req.body
      };
      db.updateGuildSettings(guild.id, settings);

      res.json({ success: true, store: settings.store });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // REST API: Universal Web Store Webhook Endpoint (Tebex / CraftingStore / WooCommerce / Custom)
  app.post('/api/store/webhook', async (req, res) => {
    try {
      const body = req.body || {};
      const guildId = req.query.guildId || body.guildId || null;
      const guild = getTargetGuild(guildId);

      if (!guild) {
        return res.status(400).json({ error: 'No active Discord guild connected to bot.' });
      }

      // Extract payload fields from diverse web store formats
      const minecraftIgn = body.ign || body.username || body.player || body.minecraft_ign || body.customer_name || 'Rixieplayz';
      const discordInput = body.discord || body.discord_id || body.discord_user || body.discord_tag || body.buyer_discord || '';
      const orderId = body.order_id || body.orderId || body.transaction_id || body.id || `MLX-${Math.floor(100000 + Math.random() * 900000)}`;
      const price = parseFloat(body.price || body.amount || body.total || 99);
      const itemName = body.item || body.package || body.item_name || body.package_name || 'LEGEND RANK';
      const paymentMethod = body.payment_method || body.gateway || 'UPI (GPay / PhonePe / Paytm / BHIM QR)';

      const result = await StoreManager.processStoreOrder(client, guild.id, {
        orderId,
        minecraftIgn,
        discordInput: discordInput || minecraftIgn,
        itemName,
        totalAmount: isNaN(price) ? 99 : price,
        paymentMethod
      });

      res.json(result);
    } catch (e) {
      Logger.error('Error in /api/store/webhook:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // REST API: Create Store Order & Ticket directly from dashboard/client
  app.post('/api/store/order', async (req, res) => {
    try {
      const guild = getTargetGuild(req.body.guildId);
      if (!guild) return res.status(400).json({ error: 'No active Discord guild connected to bot.' });

      const result = await StoreManager.processStoreOrder(client, guild.id, req.body);
      res.json(result);
    } catch (e) {
      Logger.error('Error in /api/store/order:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // REST API: Get/Update Leveling Announcement Settings
  app.get('/api/leveling/settings', (req, res) => {
    try {
      const guild = getTargetGuild(req.query.guildId);
      const settings = guild ? db.getGuildSettings(guild.id) : { leveling: {} };
      res.json({
        enabled: settings.leveling?.enabled ?? true,
        channelId: settings.leveling?.channelId || null,
        channels: guild ? guild.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name })) : []
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/leveling/settings', (req, res) => {
    try {
      const guild = getTargetGuild(req.body.guildId);
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      const settings = db.getGuildSettings(guild.id);
      if (req.body.channelId !== undefined) {
        settings.leveling.channelId = req.body.channelId;
      }
      if (req.body.enabled !== undefined) {
        settings.leveling.enabled = !!req.body.enabled;
      }
      db.updateGuildSettings(guild.id, settings);

      res.json({ success: true, leveling: settings.leveling });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // REST API: Slash Commands Directory
  app.get('/api/commands', (req, res) => {
    try {
      const commandsList = [];
      if (client.commands) {
        for (const [name, cmd] of client.commands.entries()) {
          commandsList.push({
            name: cmd.data?.name,
            description: cmd.data?.description,
            category: cmd.category || 'General',
            options: cmd.data?.options?.map(o => ({
              name: o.name,
              description: o.description,
              required: o.required || false
            })) || []
          });
        }
      }
      res.json({ commands: commandsList });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Fallback route
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.listen(port, '0.0.0.0', () => {
    Logger.success(`🌐 Moony Web Dashboard online at http://localhost:${port}`);
  });
}

module.exports = { startDashboard };

