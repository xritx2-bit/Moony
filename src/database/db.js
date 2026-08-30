const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const DEFAULT_STATE = {
  guilds: {},
  users: {},
  warnings: {},
  tickets: {},
  storeOrders: {},
  reactionRoles: {},
  reminders: [],
  feeds: []
};

class Database {
  constructor() {
    this.data = { ...DEFAULT_STATE };
    this.saveTimeout = null;
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = { ...DEFAULT_STATE, ...JSON.parse(raw) };
        Logger.success('Persistent Database loaded successfully.');
      } else {
        this.saveSync();
        Logger.info('Created new database file.');
      }
    } catch (err) {
      Logger.error('Failed to initialize database, using memory fallback:', err.message);
      this.data = { ...DEFAULT_STATE };
    }
  }

  scheduleSave() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveSync();
      this.saveTimeout = null;
    }, 1000);
  }

  saveSync() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      Logger.error('Error saving database:', err.message);
    }
  }

  // --- GUILD SETTINGS ---
  getGuildSettings(guildId) {
    if (!this.data.guilds[guildId]) {
      this.data.guilds[guildId] = {
        prefix: '!',
        modLogChannel: null,
        welcome: {
          enabled: false,
          channelId: null,
          message: 'Welcome {user} to **{server}**! We are now at **{memberCount}** members! 🎉',
          autoRoleId: null,
          botRoleId: null,
          dmWelcome: false
        },
        goodbye: {
          enabled: false,
          channelId: null,
          message: '{user.tag} has left **{server}**. We will miss you! 👋'
        },
        leveling: {
          enabled: true,
          channelId: null, // null means current channel
          rate: 1.0,
          roleRewards: {} // { "5": "roleId", "10": "roleId" }
        },
        automod: {
          antiSpam: true,
          antiLink: false,
          antiGhostPing: true,
          badWords: [],
          maxMentions: 5
        },
        tickets: {
          categoryId: null,
          logChannelId: null,
          staffRoleId: null,
          counter: 0
        },
        store: {
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
        },
        music: {
          defaultVolume: 80,
          stay247: false
        }
      };
      this.scheduleSave();
    }
    return this.data.guilds[guildId];
  }

  updateGuildSettings(guildId, newSettings) {
    const current = this.getGuildSettings(guildId);
    this.data.guilds[guildId] = { ...current, ...newSettings };
    this.scheduleSave();
    return this.data.guilds[guildId];
  }

  // --- USER & LEVELING ---
  getUserData(guildId, userId) {
    const key = `${guildId}_${userId}`;
    if (!this.data.users[key]) {
      this.data.users[key] = {
        guildId,
        userId,
        xp: 0,
        level: 0,
        lastMessageTime: 0,
        balance: 100, // starting balance
        bank: 0,
        lastDaily: 0,
        reputation: 0
      };
      this.scheduleSave();
    }
    return this.data.users[key];
  }

  addXp(guildId, userId, amount) {
    const user = this.getUserData(guildId, userId);
    user.xp += amount;

    // Level formula: level = floor(0.1 * sqrt(xp))
    const calculatedLevel = Math.floor(0.1 * Math.sqrt(user.xp));
    const leveledUp = calculatedLevel > user.level;
    if (leveledUp) {
      user.level = calculatedLevel;
    }

    this.scheduleSave();
    return { user, leveledUp, newLevel: user.level };
  }

  getLeaderboard(guildId, limit = 10) {
    const guildUsers = Object.values(this.data.users)
      .filter(u => u.guildId === guildId)
      .sort((a, b) => b.xp - a.xp);

    return guildUsers.slice(0, limit);
  }

  getUserRank(guildId, userId) {
    const guildUsers = Object.values(this.data.users)
      .filter(u => u.guildId === guildId)
      .sort((a, b) => b.xp - a.xp);

    const index = guildUsers.findIndex(u => u.userId === userId);
    return index === -1 ? guildUsers.length + 1 : index + 1;
  }

  // --- ECONOMY ---
  updateUserEconomy(guildId, userId, updates) {
    const user = this.getUserData(guildId, userId);
    Object.assign(user, updates);
    this.scheduleSave();
    return user;
  }

  // --- MODERATION & WARNINGS ---
  addWarning(guildId, userId, moderatorId, reason) {
    const key = `${guildId}_${userId}`;
    if (!this.data.warnings[key]) {
      this.data.warnings[key] = [];
    }
    const warnEntry = {
      id: Math.random().toString(36).substring(2, 8).toUpperCase(),
      moderatorId,
      reason: reason || 'No reason provided',
      timestamp: Date.now()
    };
    this.data.warnings[key].push(warnEntry);
    this.scheduleSave();
    return warnEntry;
  }

  getWarnings(guildId, userId) {
    const key = `${guildId}_${userId}`;
    return this.data.warnings[key] || [];
  }

  clearWarnings(guildId, userId) {
    const key = `${guildId}_${userId}`;
    const count = (this.data.warnings[key] || []).length;
    this.data.warnings[key] = [];
    this.scheduleSave();
    return count;
  }

  // --- TICKETS ---
  createTicket(guildId, channelId, userId, category = 'General Support') {
    const ticketId = `ticket-${Date.now().toString(36)}`;
    this.data.tickets[channelId] = {
      ticketId,
      guildId,
      channelId,
      userId,
      category,
      claimedBy: null,
      createdAt: Date.now(),
      status: 'open'
    };
    this.scheduleSave();
    return this.data.tickets[channelId];
  }

  getTicket(channelId) {
    return this.data.tickets[channelId] || null;
  }

  closeTicket(channelId, closedBy) {
    const ticket = this.getTicket(channelId);
    if (ticket) {
      ticket.status = 'closed';
      ticket.closedBy = closedBy;
      ticket.closedAt = Date.now();
      this.scheduleSave();
    }
    return ticket;
  }

  claimTicket(channelId, staffId) {
    const ticket = this.getTicket(channelId);
    if (ticket) {
      ticket.claimedBy = staffId;
      this.scheduleSave();
    }
    return ticket;
  }

  // --- MINECRAFT WEB STORE ORDERS ---
  saveStoreOrder(order) {
    if (!this.data.storeOrders) this.data.storeOrders = {};
    const orderKey = order.orderId;
    this.data.storeOrders[orderKey] = {
      ...order,
      updatedAt: Date.now()
    };
    this.scheduleSave();
    return this.data.storeOrders[orderKey];
  }

  getStoreOrder(orderId) {
    if (!this.data.storeOrders) return null;
    const formatted = orderId.startsWith('#') ? orderId : `#${orderId}`;
    return this.data.storeOrders[formatted] || this.data.storeOrders[orderId] || null;
  }

  getStoreOrders(guildId = null) {
    if (!this.data.storeOrders) return [];
    const orders = Object.values(this.data.storeOrders);
    if (guildId) {
      return orders.filter(o => o.guildId === guildId).sort((a, b) => b.createdAt - a.createdAt);
    }
    return orders.sort((a, b) => b.createdAt - a.createdAt);
  }

  updateStoreOrder(orderId, updates) {
    const order = this.getStoreOrder(orderId);
    if (order) {
      Object.assign(order, updates, { updatedAt: Date.now() });
      this.scheduleSave();
      return order;
    }
    return null;
  }

  getPendingStoreOrdersForUser(guildId, userId, username) {
    if (!this.data.storeOrders) return [];
    const lowerUser = username ? username.toLowerCase() : '';
    return Object.values(this.data.storeOrders).filter(o => {
      if (o.status !== 'pending_join' && o.status !== 'unverified_discord') return false;
      if (guildId && o.guildId !== guildId) return false;
      
      const idMatch = o.resolvedUserId === userId || o.discordInput === userId;
      const nameMatch = o.discordInput && o.discordInput.toLowerCase().includes(lowerUser);
      return idMatch || nameMatch;
    });
  }

  // --- REACTION / BUTTON ROLES ---
  saveReactionRole(messageId, roleData) {
    this.data.reactionRoles[messageId] = roleData;
    this.scheduleSave();
  }

  getReactionRole(messageId) {
    return this.data.reactionRoles[messageId] || null;
  }

  // --- REMINDERS & SCHEDULES ---
  addReminder(userId, guildId, channelId, message, fireAt) {
    const reminder = {
      id: Math.random().toString(36).substring(2, 9),
      userId,
      guildId,
      channelId,
      message,
      fireAt
    };
    this.data.reminders.push(reminder);
    this.scheduleSave();
    return reminder;
  }

  getDueReminders() {
    const now = Date.now();
    const due = this.data.reminders.filter(r => r.fireAt <= now);
    if (due.length > 0) {
      this.data.reminders = this.data.reminders.filter(r => r.fireAt > now);
      this.scheduleSave();
    }
    return due;
  }

  // --- FEEDS (YOUTUBE / REDDIT / RSS) ---
  addFeed(guildId, channelId, type, source, customMessage = null) {
    const feed = {
      id: Math.random().toString(36).substring(2, 8),
      guildId,
      channelId,
      type, // 'youtube', 'reddit', 'rss'
      source,
      customMessage,
      lastId: null,
      createdAt: Date.now()
    };
    this.data.feeds.push(feed);
    this.scheduleSave();
    return feed;
  }

  getFeeds() {
    return this.data.feeds;
  }

  updateFeedLastId(feedId, lastId) {
    const feed = this.data.feeds.find(f => f.id === feedId);
    if (feed) {
      feed.lastId = lastId;
      this.scheduleSave();
    }
  }

  removeFeed(guildId, feedId) {
    const initialLen = this.data.feeds.length;
    this.data.feeds = this.data.feeds.filter(f => !(f.guildId === guildId && f.id === feedId));
    this.scheduleSave();
    return this.data.feeds.length < initialLen;
  }
}

module.exports = new Database();
