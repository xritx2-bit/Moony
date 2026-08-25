const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const Logger = require('./utils/logger');

async function deploy() {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      try {
        const command = require(filePath);
        if (command.data && command.execute) {
          commands.push(command.data.toJSON());
        }
      } catch (err) {
        Logger.error(`Error reading ${file}:`, err.message);
      }
    }
  }

  if (!config.token) {
    Logger.error('DISCORD_TOKEN is not configured in .env file!');
    process.exit(1);
  }

  if (!config.clientId) {
    Logger.error('CLIENT_ID is not configured in .env file!');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    Logger.info(`Started refreshing ${commands.length} application (/) commands...`);

    if (config.guildId) {
      // Instant Guild Registration (recommended for development)
      Logger.info(`Deploying commands specifically to guild ID: ${config.guildId}`);
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      Logger.success(`Successfully registered ${commands.length} guild slash commands!`);
    } else {
      // Global Registration
      Logger.info('Deploying commands globally across all guilds (may take up to an hour to cache on Discord CDN)...');
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands }
      );
      Logger.success(`Successfully registered ${commands.length} global slash commands!`);
    }
  } catch (error) {
    Logger.error('Failed to deploy slash commands:', error.stack || error.message);
  }
}

if (require.main === module) {
  deploy();
}

module.exports = { deploy };
