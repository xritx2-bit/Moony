const { getGuildQueue } = require('../../utils/musicPlayer');
const Logger = require('../../utils/logger');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    const guildId = oldState.guild.id;
    const queue = getGuildQueue(guildId);
    if (!queue || !queue.voiceChannel) return;

    // Check if the bot's voice channel has no human members left
    const voiceChannel = oldState.guild.channels.cache.get(queue.voiceChannel.id);
    if (!voiceChannel) return;

    const nonBots = voiceChannel.members.filter(m => !m.user.bot);

    if (nonBots.size === 0 && !queue.stay247) {
      Logger.music(`Voice channel empty in guild ${guildId}. Setting 60s auto-disconnect timer...`);
      setTimeout(() => {
        const currentChannel = oldState.guild.channels.cache.get(queue.voiceChannel.id);
        if (currentChannel) {
          const remainingNonBots = currentChannel.members.filter(m => !m.user.bot);
          if (remainingNonBots.size === 0 && !queue.stay247) {
            Logger.music(`Auto-disconnecting from empty voice channel in guild ${guildId}.`);
            queue.textChannel?.send('👋 Left voice channel because everyone left. Rejoin anytime with `/play`!').catch(() => {});
            queue.destroy();
          }
        }
      }, 60000);
    }
  }
};
