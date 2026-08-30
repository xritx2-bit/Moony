const { EmbedBuilder } = require('discord.js');
const colors = require('./colors');

const logLevels = {
  INFO: '\x1b[36m[INFO]\x1b[0m',
  SUCCESS: '\x1b[32m[SUCCESS]\x1b[0m',
  WARN: '\x1b[33m[WARN]\x1b[0m',
  ERROR: '\x1b[31m[ERROR]\x1b[0m'
};

class Logger {
  static info(message, ...args) {
    console.log(`${new Date().toLocaleTimeString()} ${logLevels.INFO} ${message}`, ...args);
  }

  static success(message, ...args) {
    console.log(`${new Date().toLocaleTimeString()} ${logLevels.SUCCESS} ${message}`, ...args);
  }

  static warn(message, ...args) {
    console.warn(`${new Date().toLocaleTimeString()} ${logLevels.WARN} ${message}`, ...args);
  }

  static error(message, ...args) {
    console.error(`${new Date().toLocaleTimeString()} ${logLevels.ERROR} ${message}`, ...args);
  }

  static async sendModLog(guild, title, description, fields = [], color = colors.info) {
    try {
      const db = require('../database/db');
      const settings = db.getGuildSettings(guild.id);
      if (!settings.modLogChannel) return;

      const channel = guild.channels.cache.get(settings.modLogChannel);
      if (!channel || !channel.isTextBased()) return;

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ ${title}`)
        .setDescription(description)
        .setColor(color)
        .addFields(fields)
        .setTimestamp()
        .setFooter({ text: 'Moony Security & Moderation Log', iconURL: guild.iconURL() || undefined });

      await channel.send({ embeds: [embed] }).catch(() => {});
    } catch (err) {
      this.error('Failed to send mod log:', err.message);
    }
  }
}

module.exports = Logger;
