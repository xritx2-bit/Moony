const {
  Client,
  GatewayIntentBits,
  Partials
} = require('discord.js');
const config = require('./config');
const CommandHandler = require('./handlers/commandHandler');
const EventHandler = require('./handlers/eventHandler');
const { startDashboard } = require('./dashboard/server');
const Logger = require('./utils/logger');
require('./database/db'); // initialize persistent DB

// Initialize Discord Client with all required Gateway Intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember
  ]
});

// Load slash command and event registry
CommandHandler.load(client);
EventHandler.load(client);

// Automatically register/sync slash commands with Discord upon ready
client.once('ready', async () => {
  try {
    Logger.info(`Logged in as ${client.user.tag}! Registering application commands...`);
    if (config.guildId) {
      const guild = await client.guilds.fetch(config.guildId).catch(() => null);
      if (guild) {
        await guild.commands.set(client.slashCommands);
        Logger.success(`Successfully registered ${client.slashCommands.length} guild commands to guild: ${guild.name}`);
      } else {
        Logger.warn(`Guild ID ${config.guildId} not found, falling back to global command registration...`);
        await client.application.commands.set(client.slashCommands);
        Logger.success(`Successfully registered ${client.slashCommands.length} global application commands!`);
      }
    } else {
      await client.application.commands.set(client.slashCommands);
      Logger.success(`Successfully registered ${client.slashCommands.length} global application commands!`);
    }
  } catch (error) {
    Logger.error('Failed to register application commands on ready:', error.message);
  }
});

// Launch the built-in Web Dashboard
try {
  startDashboard(client, config.port || 3000);
} catch (dashErr) {
  Logger.error('Failed to start web dashboard:', dashErr.message);
}

// Error handling & process safety
process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  Logger.error('Uncaught Exception thrown:', err.stack || err.message);
});

// Authenticate with Discord Gateway
if (!config.token) {
  Logger.warn('DISCORD_TOKEN is not set in your .env file!');
  Logger.info('Please copy .env.example to .env and configure your bot credentials.');
} else {
  Logger.info('Connecting to Discord Gateway...');
  client.login(config.token).catch(err => {
    Logger.error('Failed to login to Discord:', err.message);
  });
}

module.exports = client;
