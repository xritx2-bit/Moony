const { SlashCommandBuilder } = require('discord.js');
const { getGuildQueue } = require('../../utils/musicPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('⏭️ Skip the current song and play next track'),

  async execute(interaction) {
    const queue = getGuildQueue(interaction.guildId);
    if (!queue || !queue.currentSong) {
      return interaction.reply({ content: '❌ No music is currently playing.', ephemeral: true });
    }

    const currentTitle = queue.currentSong.title;
    queue.skip();
    await interaction.reply(`⏭️ Skipped: **${currentTitle}**`);
  }
};
