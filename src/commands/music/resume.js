const { SlashCommandBuilder } = require('discord.js');
const { getGuildQueue } = require('../../utils/musicPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('▶️ Resume paused music playback'),

  async execute(interaction) {
    const queue = getGuildQueue(interaction.guildId);
    if (!queue || !queue.currentSong) {
      return interaction.reply({ content: '❌ No music is currently playing.', ephemeral: true });
    }

    if (!queue.paused) {
      return interaction.reply({ content: '⚠️ Music is already playing!', ephemeral: true });
    }

    queue.resume();
    await interaction.reply('▶️ Resumed music playback.');
    queue.sendNowPlayingEmbed();
  }
};
