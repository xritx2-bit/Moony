const ButtonHandler = require('../../handlers/buttonHandler');
const Logger = require('../../utils/logger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // 1. Slash Command
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        return interaction.reply({ content: '❌ Unknown command.', ephemeral: true });
      }

      try {
        await command.execute(interaction, client);
      } catch (error) {
        Logger.error(`Error executing command ${interaction.commandName}:`, error.stack || error.message);
        const replyPayload = {
          content: `❌ There was an unexpected error while executing this command: \`${error.message}\``,
          ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(replyPayload).catch(() => {});
        } else {
          await interaction.reply(replyPayload).catch(() => {});
        }
      }
      return;
    }

    // 2. Autocomplete
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command && command.autocomplete) {
        try {
          await command.autocomplete(interaction, client);
        } catch (err) {
          Logger.error(`Autocomplete error in ${interaction.commandName}:`, err.message);
        }
      }
      return;
    }

    // 3. Button Interactions
    if (interaction.isButton()) {
      try {
        await ButtonHandler.handle(interaction);
      } catch (err) {
        Logger.error('Button handler error:', err.stack || err.message);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: `❌ Button interaction failed: ${err.message}`, ephemeral: true }).catch(() => {});
        }
      }
      return;
    }
  }
};
