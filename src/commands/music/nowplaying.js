const { SlashCommandBuilder } = require('discord.js');
const { getGuildQueue } = require('../../utils/musicPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('🎵 Display the interactive Spotify Now Playing player'),

  async execute(interaction) {
    const queue = getGuildQueue(interaction.guildId);
    if (!queue || !queue.currentSong) {
      return interaction.reply({ content: '❌ No music is currently playing.', ephemeral: true });
    }

    await interaction.reply({ content: '🎵 Updating Now Playing embed...', ephemeral: true });
    await queue.sendNowPlayingEmbed();
  }
};
