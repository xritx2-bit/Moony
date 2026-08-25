const { SlashCommandBuilder } = require('discord.js');
const { getGuildQueue } = require('../../utils/musicPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('🔁 Change loop mode')
    .addStringOption(opt =>
      opt
        .setName('mode')
        .setDescription('Loop mode to set')
        .setRequired(false)
        .addChoices(
          { name: 'Off', value: 'off' },
          { name: '🔂 Track (Loop single song)', value: 'track' },
          { name: '🔁 Queue (Loop entire queue)', value: 'queue' }
        )
    ),

  async execute(interaction) {
    const queue = getGuildQueue(interaction.guildId);
    if (!queue || !queue.currentSong) {
      return interaction.reply({ content: '❌ No music is currently playing.', ephemeral: true });
    }

    const mode = interaction.options.getString('mode');
    if (mode === 'off') {
      queue.loopMode = 0;
    } else if (mode === 'track') {
      queue.loopMode = 1;
    } else if (mode === 'queue') {
      queue.loopMode = 2;
    } else {
      queue.toggleLoop();
    }

    const labels = ['Off', '🔂 Track', '🔁 Queue'];
    await interaction.reply(`🔁 Loop mode set to: **${labels[queue.loopMode]}**`);
    queue.sendNowPlayingEmbed();
  }
};
