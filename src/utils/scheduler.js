const cron = require('node-cron');
const Parser = require('rss-parser');
const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const colors = require('./colors');
const Logger = require('./logger');

const rssParser = new Parser();

class Scheduler {
  static init(client) {
    Logger.info('Initializing automated background schedulers (Reminders & Feeds)...');

    // 1. Check reminders every 5 seconds
    setInterval(() => {
      this.checkReminders(client);
    }, 5000);

    // 2. Check feeds (YouTube, Reddit, RSS) every 2 minutes
    cron.schedule('*/2 * * * *', () => {
      this.checkFeeds(client);
    });
  }

  static async checkReminders(client) {
    try {
      const due = db.getDueReminders();
      for (const rem of due) {
        try {
          const user = await client.users.fetch(rem.userId).catch(() => null);
          const channel = rem.channelId ? await client.channels.fetch(rem.channelId).catch(() => null) : null;

          const embed = new EmbedBuilder()
            .setColor(colors.warning)
            .setTitle('⏰ Reminder Alert!')
            .setDescription(`Hey <@${rem.userId}>, here is the reminder you asked for:\n\n> **${rem.message}**`)
            .setTimestamp();

          if (channel && channel.isTextBased()) {
            await channel.send({ content: `<@${rem.userId}>`, embeds: [embed] }).catch(() => {});
          } else if (user) {
            await user.send({ embeds: [embed] }).catch(() => {});
          }
        } catch (e) {
          Logger.error('Failed to dispatch reminder:', e.message);
        }
      }
    } catch (err) {
      Logger.error('Reminder check error:', err.message);
    }
  }

  static async checkFeeds(client) {
    try {
      const feeds = db.getFeeds();
      if (!feeds || feeds.length === 0) return;

      for (const feed of feeds) {
        try {
          const channel = await client.channels.fetch(feed.channelId).catch(() => null);
          if (!channel || !channel.isTextBased()) continue;

          if (feed.type === 'reddit') {
            await this.handleRedditFeed(feed, channel);
          } else if (feed.type === 'rss' || feed.type === 'youtube') {
            await this.handleRssFeed(feed, channel);
          }
        } catch (feedErr) {
          Logger.error(`Feed processing error (${feed.source}):`, feedErr.message);
        }
      }
    } catch (err) {
      Logger.error('Feeds scheduler error:', err.message);
    }
  }

  static async handleRedditFeed(feed, channel) {
    try {
      const subreddit = feed.source.replace(/^r\//, '');
      const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=5`;
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'MoonyDiscordBot/1.0' },
        timeout: 8000
      });

      const posts = res.data?.data?.children || [];
      if (posts.length === 0) return;

      const latest = posts[0].data;
      if (feed.lastId === latest.id) return; // Already posted

      db.updateFeedLastId(feed.id, latest.id);

      const embed = new EmbedBuilder()
        .setColor(0xFF4500) // Reddit Orange
        .setAuthor({ name: `r/${subreddit} • New Post`, iconURL: 'https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-180x180.png' })
        .setTitle(latest.title.slice(0, 250))
        .setURL(`https://reddit.com${latest.permalink}`)
        .setDescription(latest.selftext ? latest.selftext.slice(0, 400) + '...' : '')
        .setFooter({ text: `Posted by u/${latest.author} • 👍 ${latest.ups}` })
        .setTimestamp(latest.created_utc * 1000);

      if (latest.url && (latest.url.endsWith('.png') || latest.url.endsWith('.jpg') || latest.url.endsWith('.gif'))) {
        embed.setImage(latest.url);
      }

      await channel.send({
        content: feed.customMessage ? feed.customMessage.replace('{url}', `https://reddit.com${latest.permalink}`) : `📰 **New post in r/${subreddit}!**`,
        embeds: [embed]
      });
    } catch (e) {
      // ignore transient reddit rate limits
    }
  }

  static async handleRssFeed(feed, channel) {
    try {
      const feedData = await rssParser.parseURL(feed.source);
      if (!feedData || !feedData.items || feedData.items.length === 0) return;

      const latest = feedData.items[0];
      const latestId = latest.id || latest.guid || latest.link;

      if (feed.lastId === latestId) return;

      db.updateFeedLastId(feed.id, latestId);

      const isYouTube = feed.type === 'youtube' || feed.source.includes('youtube.com');

      const embed = new EmbedBuilder()
        .setColor(isYouTube ? 0xFF0000 : colors.primary)
        .setTitle(latest.title?.slice(0, 250) || 'New Feed Update')
        .setURL(latest.link || '#')
        .setDescription(latest.contentSnippet ? latest.contentSnippet.slice(0, 300) + '...' : '')
        .setFooter({ text: `${feedData.title || 'RSS Feed'}` })
        .setTimestamp(latest.pubDate ? new Date(latest.pubDate) : new Date());

      await channel.send({
        content: feed.customMessage
          ? feed.customMessage.replace('{url}', latest.link).replace('{title}', latest.title)
          : (isYouTube ? `🔴 **New YouTube Video Uploaded!**\n${latest.link}` : `📢 **New Update from ${feedData.title}**`),
        embeds: isYouTube ? [] : [embed]
      });
    } catch (e) {
      // ignore RSS parse error
    }
  }
}

module.exports = Scheduler;
