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

  // Bot Appearance & Defaults
  bot: {
    name: 'Moony',
    activity: 'Playing /help | 🛡️ Security, Leveling & Store Tickets',
    status: 'online',
    embedColor: 0x5865F2, // Discord Blurple
    successColor: 0x57F287, // Green
    errorColor: 0xED4245, // Red
    warningColor: 0xFEE75C, // Yellow
    levelColor: 0x9B59B6, // Purple
  },

  // Leveling defaults
  leveling: {
    minXpPerMsg: 15,
    maxXpPerMsg: 25,
    cooldownSeconds: 60,
    voiceXpPerMinute: 10
  }
};
