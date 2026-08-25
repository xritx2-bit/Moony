const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const Logger = require('../utils/logger');

class CommandHandler {
  static load(client) {
    client.commands = new Collection();
    client.slashCommands = [];

    const commandsPath = path.join(__dirname, '../commands');
    const categories = fs.readdirSync(commandsPath);

    let totalCommands = 0;

    for (const category of categories) {
      const categoryPath = path.join(commandsPath, category);
      if (!fs.statSync(categoryPath).isDirectory()) continue;

      const commandFiles = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));

      for (const file of commandFiles) {
        const filePath = path.join(categoryPath, file);
        try {
          const command = require(filePath);
          if (command.data && command.execute) {
            command.category = category;
            client.commands.set(command.data.name, command);
            client.slashCommands.push(command.data.toJSON());
            totalCommands++;
          } else {
            Logger.warn(`Command at ${filePath} is missing data or execute.`);
          }
        } catch (err) {
          Logger.error(`Failed to load command ${file}:`, err.message);
        }
      }
    }

    Logger.success(`Loaded ${totalCommands} slash commands across ${categories.length} categories.`);
  }
}

module.exports = CommandHandler;
