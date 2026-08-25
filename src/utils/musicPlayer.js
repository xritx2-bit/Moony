const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');
const play = require('play-dl');
const ytdl = require('@distube/ytdl-core');
const SpotifyResolver = require('./spotifyResolver');
const colors = require('./colors');
const Logger = require('./logger');

// Global guild music managers map
const queues = new Map();

class GuildQueue {
  constructor(guildId, textChannel, voiceChannel) {
    this.guildId = guildId;
    this.textChannel = textChannel;
    this.voiceChannel = voiceChannel;
    this.connection = null;
    this.player = createAudioPlayer();
    this.songs = [];
    this.previousSongs = [];
    this.playing = false;
    this.paused = false;
    this.volume = 80;
    this.loopMode = 0; // 0 = off, 1 = track, 2 = queue
    this.nowPlayingMessage = null;
    this.currentResource = null;
    this.playbackStartTime = 0;
    this.stay247 = false;

    this.setupPlayerEvents();
  }

  setupPlayerEvents() {
    this.player.on(AudioPlayerStatus.Playing, () => {
      this.playing = true;
      this.paused = false;
      this.playbackStartTime = Date.now();
      Logger.music(`Now playing in ${this.guildId}: ${this.currentSong?.title}`);
      this.sendNowPlayingEmbed();
    });

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.playing = false;
      this.handleSongEnd();
    });

    this.player.on('error', error => {
      Logger.error(`Audio player error in ${this.guildId}:`, error.message);
      this.textChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.danger)
            .setDescription(`⚠️ Audio Stream error: ${error.message}. Skipping to next track...`)
        ]
      }).catch(() => {});
      this.skip();
    });
  }

  get currentSong() {
    return this.songs[0] || null;
  }

  get currentPlaybackTime() {
    if (!this.playing || !this.playbackStartTime) return 0;
    if (this.paused) return 0;
    return Math.floor((Date.now() - this.playbackStartTime) / 1000);
  }

  async connect() {
    if (this.connection && this.connection.state.status === VoiceConnectionStatus.Ready) {
      return this.connection;
    }

    if (this.connection && this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
      try {
        await entersState(this.connection, VoiceConnectionStatus.Ready, 15_000);
        return this.connection;
      } catch (e) {
        this.connection.destroy();
        this.connection = null;
      }
    }

    this.connection = joinVoiceChannel({
      channelId: this.voiceChannel.id,
      guildId: this.guildId,
      adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true
    });

    this.connection.on('error', err => {
      Logger.error(`Voice connection error in guild ${this.guildId}:`, err.message);
    });

    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 25_000);
      this.connection.subscribe(this.player);
      return this.connection;
    } catch (error) {
      this.destroy();
      throw new Error(`Failed to establish voice connection: ${error.message}`);
    }
  }

  async play() {
    if (this.songs.length === 0) {
      if (!this.stay247) {
        this.destroy();
      }
      return;
    }

    let song = this.songs[0];

    // If lazy loaded track (e.g. from Spotify playlist), resolve full YouTube URL now
    if (song.isLazy && !song.url) {
      const resolved = await SpotifyResolver.searchYouTubeTrack(song.title, song.requester);
      if (resolved) {
        song.url = resolved.url;
        song.thumbnail = song.thumbnail || resolved.thumbnail;
        song.duration = resolved.duration;
        song.formattedDuration = resolved.formattedDuration;
        song.isLazy = false;
      } else {
        this.textChannel.send(`⚠️ Could not resolve audio for "${song.title}", skipping...`).catch(() => {});
        this.songs.shift();
        return this.play();
      }
    }

    try {
      await this.connect();

      let stream;
      let streamType = undefined;

      if (song.isDirectAudio || SpotifyResolver.isDirectAudioUrl(song.url)) {
        // Direct stream or web radio
        this.currentResource = createAudioResource(song.url, { inlineVolume: true });
      } else {
        // YouTube / Spotify resolved audio
        try {
          const playStream = await play.stream(song.url);
          stream = playStream.stream;
          streamType = playStream.type;
        } catch (playErr) {
          // Fallback to ytdl-core
          stream = ytdl(song.url, {
            filter: 'audioonly',
            highWaterMark: 1 << 25,
            quality: 'highestaudio'
          });
        }

        this.currentResource = createAudioResource(stream, {
          inputType: streamType,
          inlineVolume: true
        });
      }

      if (this.currentResource.volume) {
        this.currentResource.volume.setVolume(this.volume / 100);
      }

      this.player.play(this.currentResource);
    } catch (err) {
      Logger.error(`Playback start failure in ${this.guildId}:`, err.message);
      this.textChannel.send(`❌ Failed to stream track: **${song.title}** (${err.message}). Skipping...`).catch(() => {});
      this.songs.shift();
      this.play();
    }
  }

  handleSongEnd() {
    const finishedSong = this.songs[0];
    if (finishedSong) {
      this.previousSongs.unshift(finishedSong);
      if (this.previousSongs.length > 20) this.previousSongs.pop();
    }

    if (this.loopMode === 1) {
      // Loop Current Track: Keep songs[0] as is
    } else if (this.loopMode === 2) {
      // Loop Queue: Move finished song to end
      const song = this.songs.shift();
      if (song) this.songs.push(song);
    } else {
      // Normal: Shift out
      this.songs.shift();
    }

    if (this.songs.length > 0) {
      this.play();
    } else {
      if (this.nowPlayingMessage) {
        this.nowPlayingMessage.delete().catch(() => {});
        this.nowPlayingMessage = null;
      }
      this.textChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.spotify)
            .setTitle('🎵 Queue Completed')
            .setDescription('Enjoyed the vibes? Add more tracks with `/play` or start 24/7 radio with `/radio`!')
        ]
      }).catch(() => {});

      if (!this.stay247) {
        setTimeout(() => {
          if (this.songs.length === 0 && !this.playing) {
            this.destroy();
          }
        }, 60000); // 1 minute idle disconnect
      }
    }
  }

  skip() {
    this.player.stop();
  }

  previous() {
    if (this.previousSongs.length === 0) return false;
    const prev = this.previousSongs.shift();
    this.songs.unshift(prev);
    this.play();
    return true;
  }

  pause() {
    if (this.player.state.status === AudioPlayerStatus.Playing) {
      this.player.pause();
      this.paused = true;
      return true;
    }
    return false;
  }

  resume() {
    if (this.player.state.status === AudioPlayerStatus.Paused) {
      this.player.unpause();
      this.paused = false;
      return true;
    }
    return false;
  }

  setVolume(vol) {
    this.volume = Math.max(1, Math.min(vol, 150));
    if (this.currentResource && this.currentResource.volume) {
      this.currentResource.volume.setVolume(this.volume / 100);
    }
  }

  shuffle() {
    if (this.songs.length <= 1) return false;
    const current = this.songs[0];
    const rest = this.songs.slice(1);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    this.songs = [current, ...rest];
    return true;
  }

  toggleLoop() {
    // 0 -> 1 (track) -> 2 (queue) -> 0 (off)
    this.loopMode = (this.loopMode + 1) % 3;
    return this.loopMode;
  }

  destroy() {
    try {
      this.songs = [];
      this.player.stop();
      if (this.connection) {
        this.connection.destroy();
        this.connection = null;
      }
      if (this.nowPlayingMessage) {
        this.nowPlayingMessage.delete().catch(() => {});
        this.nowPlayingMessage = null;
      }
    } catch (e) {}
    queues.delete(this.guildId);
  }

  // --- SPOTIFY-LIKE NOW PLAYING EMBED & INTERACTIVE BUTTONS ---
  async sendNowPlayingEmbed() {
    const song = this.currentSong;
    if (!song) return;

    const currentSec = this.currentPlaybackTime;
    const totalSec = song.duration;
    const progressBar = SpotifyResolver.createProgressBar(currentSec, totalSec, 14);

    const loopLabels = ['Off', '🔂 Track', '🔁 Queue'];

    const embed = new EmbedBuilder()
      .setColor(colors.spotify)
      .setAuthor({
        name: 'Spotify Music Player • Now Streaming',
        iconURL: 'https://cdn-icons-png.flaticon.com/512/174/174872.png'
      })
      .setTitle(`🎵 ${song.spotifyTitle || song.title}`)
      .setURL(song.url || 'https://spotify.com')
      .setDescription(
        `**Artist:** ${song.spotifyArtist || song.author || 'Internet Music'}\n` +
        `**Requested by:** <@${song.requester.id}>\n\n` +
        `${progressBar}\n` +
        `\`Volume: ${this.volume}%\` • \`Loop: ${loopLabels[this.loopMode]}\` • \`In Queue: ${this.songs.length - 1} tracks\``
      )
      .setThumbnail(song.thumbnail || 'https://i.scdn.co/image/ab67616d0000b2736bb6e4b85c880894548483f8')
      .setFooter({ text: 'Moony Spotify Engine • Control playback using the buttons below' })
      .setTimestamp();

    // Interactive Control Rows (Spotify Media Controller)
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_prev')
        .setEmoji('⏮️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_toggle')
        .setEmoji(this.paused ? '▶️' : '⏸️')
        .setStyle(this.paused ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('music_skip')
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_loop')
        .setEmoji('🔁')
        .setStyle(this.loopMode > 0 ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_shuffle')
        .setEmoji('🔀')
        .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_voldown')
        .setEmoji('🔉')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_volup')
        .setEmoji('🔊')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_queue')
        .setEmoji('📜')
        .setLabel('Queue')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_like')
        .setEmoji('💖')
        .setLabel('Save')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_stop')
        .setEmoji('⏹️')
        .setStyle(ButtonStyle.Danger)
    );

    try {
      if (this.nowPlayingMessage) {
        await this.nowPlayingMessage.delete().catch(() => {});
      }
      this.nowPlayingMessage = await this.textChannel.send({
        embeds: [embed],
        components: [row1, row2]
      });
    } catch (err) {
      Logger.error('Failed to send Now Playing embed:', err.message);
    }
  }
}

function getGuildQueue(guildId) {
  return queues.get(guildId) || null;
}

function createGuildQueue(guildId, textChannel, voiceChannel) {
  let queue = queues.get(guildId);
  if (!queue) {
    queue = new GuildQueue(guildId, textChannel, voiceChannel);
    queues.set(guildId, queue);
  }
  return queue;
}

module.exports = {
  queues,
  GuildQueue,
  getGuildQueue,
  createGuildQueue
};
