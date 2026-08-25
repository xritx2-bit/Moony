const { ActivityType, Events } = require('discord.js');
const Scheduler = require('../../utils/scheduler');
const Logger = require('../../utils/logger');
const config = require('../../config');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    Logger.success(`Logged in and operational as ${client.user.tag} (ID: ${client.user.id})!`);
    Logger.info(`Connected to ${client.guilds.cache.size} servers serving ${client.users.cache.size} cached users.`);

    // Initialize automated background timers & feed watchers
    Scheduler.init(client);

    // Dynamic rotating bot activity statuses
    const activities = [
      { name: '/help | 🎵 Spotify Music', type: ActivityType.Listening },
      { name: `${client.guilds.cache.size} servers | /play`, type: ActivityType.Watching },
      { name: 'Lo-Fi 24/7 | /radio', type: ActivityType.Listening },
      { name: 'Moony AI Assistant | /ask', type: ActivityType.Playing },
      { name: 'Leaderboard | /rank', type: ActivityType.Competing }
    ];

    let activityIndex = 0;
    setInterval(() => {
      const act = activities[activityIndex];
      client.user.setPresence({
        activities: [{ name: act.name, type: act.type }],
        status: 'online'
      });
      activityIndex = (activityIndex + 1) % activities.length;
    }, 15000);

    // Initial presence
    client.user.setPresence({
      activities: [activities[0]],
      status: 'online'
    });
  }
};
