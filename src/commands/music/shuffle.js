const { SlashCommandBuilder } = require('discord.js');
const { getGuildQueue } = require('../../utils/musicPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('🔀 Shuffle all upcoming songs in the queue'),

  async execute(interaction) {
    const queue = getGuildQueue(interaction.guildId);
    if (!queue || !queue.currentSong) {
      return interaction.reply({ content: '❌ No music is currently playing.', ephemeral: true });
    }

    const success = queue.shuffle();
    if (!success) {
      return interaction.reply({ content: '❌ Need at least 2 songs in the queue to shuffle.', ephemeral: true });
    }

    await interaction.reply(`🔀 Successfully shuffled **${queue.songs.length - 1}** upcoming tracks!`);
  }
};
