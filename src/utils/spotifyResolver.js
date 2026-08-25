const axios = require('axios');
const YouTube = require('youtube-sr').default;
const Logger = require('./logger');

class SpotifyResolver {
  static isSpotifyUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return /https?:\/\/(open\.spotify\.com|spotify\.link)\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/.test(url);
  }

  static isYouTubeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(url);
  }

  static isDirectAudioUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return /^(https?:\/\/).+\.(mp3|wav|ogg|flac|m4a|aac)(\?.*)?$/i.test(url) || url.includes('stream.zeno.fm');
  }

  /**
   * Resolves a Spotify track, album, playlist, or artist URL to playable track objects
   */
  static async resolveSpotify(url, requester) {
    try {
      const match = url.match(/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
      if (!match) return null;

      const type = match[1];
      const id = match[2];

      // Using public Spotify embed scraper (no developer token required fallback)
      const embedUrl = `https://open.spotify.com/embed/${type}/${id}`;
      const response = await axios.get(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000
      });

      const html = response.data;
      const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      
      if (!jsonMatch) {
        // Fallback for simple track using title tags
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        if (titleMatch) {
          const rawTitle = titleMatch[1].replace(' | Spotify', '').trim();
          const resolved = await this.searchYouTubeTrack(rawTitle, requester);
          return resolved ? [resolved] : [];
        }
        return [];
      }

      const nextData = JSON.parse(jsonMatch[1]);
      const entity = nextData?.props?.pageProps?.state?.data?.entity;

      if (!entity) return [];

      const tracks = [];

      if (type === 'track') {
        const title = entity.name;
        const artist = entity.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
        const thumbnail = entity.coverArt?.sources?.[0]?.url || 'https://i.scdn.co/image/ab67616d0000b2736bb6e4b85c880894548483f8';
        const durationSec = Math.floor((entity.duration || 180000) / 1000);

        const ytResult = await this.searchYouTubeTrack(`${artist} - ${title}`, requester);
        if (ytResult) {
          ytResult.spotifyTitle = title;
          ytResult.spotifyArtist = artist;
          ytResult.thumbnail = thumbnail || ytResult.thumbnail;
          tracks.push(ytResult);
        }
      } else if (type === 'album' || type === 'playlist') {
        const trackList = entity.trackList || entity.tracksList || [];
        for (const t of trackList.slice(0, 100)) { // limit to 100 tracks per playlist
          const title = t.title || t.name;
          const artist = t.subtitle || (t.artists?.map(a => a.name).join(', ')) || entity.name;
          const durationSec = Math.floor((t.duration || 180000) / 1000);

          tracks.push({
            title: `${artist} - ${title}`,
            spotifyTitle: title,
            spotifyArtist: artist,
            url: null, // to be resolved on play
            duration: durationSec,
            formattedDuration: this.formatDuration(durationSec),
            thumbnail: entity.coverArt?.sources?.[0]?.url || null,
            requester,
            isLazy: true
          });
        }
      }

      return tracks;
    } catch (err) {
      Logger.error('Spotify resolver error:', err.message);
      return [];
    }
  }

  /**
   * Search YouTube for best audio match
   */
  static async searchYouTubeTrack(query, requester) {
    try {
      const video = await YouTube.searchOne(query);
      if (!video) return null;

      return {
        title: video.title,
        url: video.url,
        duration: video.duration / 1000 || 0,
        formattedDuration: video.durationFormatted || 'Live',
        thumbnail: video.thumbnail?.url || 'https://i.imgur.com/7bJd3Gg.png',
        author: video.channel?.name || 'Unknown Artist',
        requester,
        isLazy: false
      };
    } catch (err) {
      Logger.error('YouTube search error:', err.message);
      return null;
    }
  }

  /**
   * Live search query autocomplete recommendations (Spotify/YouTube style)
   */
  static async getSearchSuggestions(query, limit = 10) {
    try {
      if (!query || query.trim().length === 0) return [];
      const videos = await YouTube.search(query, { limit });
      return videos.map(v => ({
        name: `${v.title.slice(0, 80)} [${v.durationFormatted || 'Live'}]`,
        value: v.url
      }));
    } catch (err) {
      return [];
    }
  }

  static formatDuration(seconds) {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Creates a visual animated Spotify progress bar: [🔘──────────] 01:23 / 03:45
   */
  static createProgressBar(currentSec, totalSec, length = 15) {
    if (!totalSec || totalSec <= 0) {
      return '🔴 LIVE STREAM 🔘────────────';
    }
    const progress = Math.min(Math.max(currentSec / totalSec, 0), 1);
    const progressChars = Math.round(length * progress);
    const emptyChars = length - progressChars;

    const bar = '━'.repeat(Math.max(0, progressChars - 1)) + '🔘' + '─'.repeat(Math.max(0, emptyChars));
    return `${bar} \`[${this.formatDuration(currentSec)} / ${this.formatDuration(totalSec)}]\``;
  }
}

module.exports = SpotifyResolver;
