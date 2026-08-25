const { SlashCommandBuilder } = require('discord.js');
const { getGuildQueue } = require('../../utils/musicPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('previous')
    .setDescription('⏮️ Go back and play the previous track'),

  async execute(interaction) {
    const queue = getGuildQueue(interaction.guildId);
    if (!queue) {
      return interaction.reply({ content: '❌ No active music session.', ephemeral: true });
    }

    const success = queue.previous();
    if (success) {
      await interaction.reply('⏮️ Playing the previous track.');
    } else {
      await interaction.reply({ content: '❌ No previous track in history.', ephemeral: true });
    }
  }
};
