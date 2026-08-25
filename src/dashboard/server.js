const express = require('express');
const path = require('path');
const os = require('os');
const { queues } = require('../utils/musicPlayer');
const db = require('../database/db');
const Logger = require('../utils/logger');

function startDashboard(client, port = 3000) {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  // REST API: Live Bot Stats & Diagnostics
  app.get('/api/stats', (req, res) => {
    try {
      const uptimeSec = Math.floor(process.uptime());
      const days = Math.floor(uptimeSec / 86400);
      const hours = Math.floor((uptimeSec % 86400) / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);

      const activeQueuesCount = Array.from(queues.values()).filter(q => q.playing).length;
      const totalSongsPlayed = Object.values(db.data.playlists || {}).reduce(
        (acc, pl) => acc + Object.keys(pl).length,
        0
      );

      res.json({
        botName: client.user?.username || 'Moony',
        botAvatar: client.user?.displayAvatarURL() || null,
        botId: client.user?.id || null,
        ping: Math.round(client.ws?.ping || 0),
        guildCount: client.guilds.cache.size,
        userCount: client.users.cache.size,
        commandCount: client.commands ? client.commands.size : 0,
        activeVoiceStreams: activeQueuesCount,
        totalPlaylistsSaved: totalSongsPlayed,
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

  // REST API: Active Live Music Streams Monitor
  app.get('/api/music', (req, res) => {
    try {
      const activeStreams = [];
      for (const [guildId, queue] of queues.entries()) {
        const guild = client.guilds.cache.get(guildId);
        if (queue && queue.currentSong) {
          activeStreams.push({
            guildId,
            guildName: guild?.name || 'Discord Server',
            guildIcon: guild?.iconURL() || null,
            currentSong: {
              title: queue.currentSong.spotifyTitle || queue.currentSong.title,
              artist: queue.currentSong.spotifyArtist || queue.currentSong.author || 'Artist',
              thumbnail: queue.currentSong.thumbnail,
              duration: queue.currentSong.formattedDuration,
              currentTimeSec: queue.currentPlaybackTime,
              totalTimeSec: queue.currentSong.duration,
              requester: queue.currentSong.requester?.tag || 'User'
            },
            volume: queue.volume,
            paused: queue.paused,
            loopMode: queue.loopMode,
            queueLength: queue.songs.length
          });
        }
      }
      res.json({ streams: activeStreams });
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

  app.listen(port, () => {
    Logger.success(`🌐 Moony Web Dashboard online at http://localhost:${port}`);
  });
}

module.exports = { startDashboard };
