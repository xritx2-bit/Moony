require('dotenv').config();

function cleanEnv(val) {
  if (!val) return '';
  return String(val).trim().replace(/^["']|["']$/g, '').trim();
}

module.exports = {
  get token() {
    return cleanEnv(process.env.DISCORD_TOKEN);
  },
  get clientId() {
    return cleanEnv(process.env.CLIENT_ID);
  },
  get guildId() {
    return cleanEnv(process.env.GUILD_ID);
  },
  get ownerId() {
    return cleanEnv(process.env.OWNER_ID);
  },
  get prefix() {
    return process.env.DEFAULT_PREFIX || '!';
  },
  get port() {
    return parseInt(process.env.PORT, 10) || 3000;
  },
  
  // AI Keys (Supports all common naming conventions and auto-cleans quotes/spaces)
  get geminiKey() {
    return cleanEnv(
      process.env.GEMINI_API_KEY ||
      process.env.GEMINI_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GEMINI_KEY ||
      process.env.GEMINI_TOKEN ||
      ''
    );
  },
  get openaiKey() {
    return cleanEnv(
      process.env.OPENAI_API_KEY ||
      process.env.OPENAI_KEY ||
      ''
    );
  },

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
