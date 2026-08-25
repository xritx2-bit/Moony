require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || '',
  ownerId: process.env.OWNER_ID || '',
  prefix: process.env.DEFAULT_PREFIX || '!',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // AI Keys
  geminiKey: process.env.GEMINI_API_KEY || '',
  openaiKey: process.env.OPENAI_API_KEY || '',

  // Spotify integration
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || '',
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',

  // Bot Appearance & Defaults
  bot: {
    name: 'Moony',
    activity: 'Playing /help | 🎵 Spotify Music & All-in-One Server Management',
    status: 'online',
    embedColor: 0x5865F2, // Discord Blurple
    successColor: 0x57F287, // Green
    errorColor: 0xED4245, // Red
    warningColor: 0xFEE75C, // Yellow
    spotifyColor: 0x1DB954, // Spotify Green
    levelColor: 0x9B59B6, // Purple
  },

  // Audio Radio Stations (24/7 Live Web streams)
  radioStations: {
    lofi: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    chill: 'https://stream.zeno.fm/0r0xa792kwzuv',
    synthwave: 'https://stream.zeno.fm/0543eef6a08uv',
    gaming: 'https://stream.zeno.fm/w22n66ndg8uv',
    pop: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    anime: 'https://stream.zeno.fm/7cvs804nvy5tv'
  },

  // Leveling defaults
  leveling: {
    minXpPerMsg: 15,
    maxXpPerMsg: 25,
    cooldownSeconds: 60,
    voiceXpPerMinute: 10
  }
};
