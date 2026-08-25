const { SlashCommandBuilder } = require('discord.js');
const { getGuildQueue } = require('../../utils/musicPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('🔊 Adjust playback volume')
    .addIntegerOption(opt =>
      opt
        .setName('percent')
        .setDescription('Volume level (1 to 150%)')
        .setMinValue(1)
        .setMaxValue(150)
        .setRequired(true)
    ),

  async execute(interaction) {
    const queue = getGuildQueue(interaction.guildId);
    if (!queue || !queue.currentSong) {
      return interaction.reply({ content: '❌ No music is currently playing.', ephemeral: true });
    }

    const volume = interaction.options.getInteger('percent');
    queue.setVolume(volume);

    await interaction.reply(`🔊 Volume set to **${volume}%**.`);
    queue.sendNowPlayingEmbed();
  }
};
