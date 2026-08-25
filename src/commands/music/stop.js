const { SlashCommandBuilder } = require('discord.js');
const { getGuildQueue } = require('../../utils/musicPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('⏹️ Stop music playback, clear queue, and disconnect bot'),

  async execute(interaction) {
    const queue = getGuildQueue(interaction.guildId);
    if (!queue) {
      return interaction.reply({ content: '❌ No active music playback found.', ephemeral: true });
    }

    queue.destroy();
    await interaction.reply('⏹️ Stopped playback, cleared the queue, and disconnected from the voice channel.');
  }
};
