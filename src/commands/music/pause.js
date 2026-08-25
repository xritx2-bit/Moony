const { SlashCommandBuilder } = require('discord.js');
const { getGuildQueue } = require('../../utils/musicPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('⏸️ Pause the current playing track'),

  async execute(interaction) {
    const queue = getGuildQueue(interaction.guildId);
    if (!queue || !queue.currentSong) {
      return interaction.reply({ content: '❌ No music is currently playing.', ephemeral: true });
    }

    if (queue.paused) {
      return interaction.reply({ content: '⚠️ Music is already paused. Use `/resume` to unpause!', ephemeral: true });
    }

    queue.pause();
    await interaction.reply('⏸️ Paused music playback.');
    queue.sendNowPlayingEmbed();
  }
};
