const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildQueue } = require('../../utils/musicPlayer');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('📜 View the current music queue and upcoming tracks')
    .addIntegerOption(opt =>
      opt.setName('page').setDescription('Page number of the queue').setMinValue(1)
    ),

  async execute(interaction) {
    const queue = getGuildQueue(interaction.guildId);
    if (!queue || queue.songs.length === 0) {
      return interaction.reply({ content: '❌ The music queue is currently empty.', ephemeral: true });
    }

    const page = interaction.options.getInteger('page') || 1;
    const itemsPerPage = 10;
    const totalPages = Math.ceil(queue.songs.length / itemsPerPage) || 1;

    if (page > totalPages) {
      return interaction.reply({ content: `❌ Page ${page} does not exist. Total pages: ${totalPages}`, ephemeral: true });
    }

    const startIdx = (page - 1) * itemsPerPage;
    const currentTracks = queue.songs.slice(startIdx, startIdx + itemsPerPage);

    const description = currentTracks
      .map((t, idx) => {
        const actualIdx = startIdx + idx;
        const prefix = actualIdx === 0 ? '▶️ **Now Playing:**' : `\`${actualIdx}.\``;
        return `${prefix} [${t.spotifyTitle || t.title}](${t.url || 'https://spotify.com'}) (${t.formattedDuration}) • <@${t.requester.id}>`;
      })
      .join('\n\n');

    const totalDurationSec = queue.songs.reduce((acc, s) => acc + (s.duration || 0), 0);
    const formattedTotal = `${Math.floor(totalDurationSec / 60)} mins ${totalDurationSec % 60} secs`;

    const embed = new EmbedBuilder()
      .setColor(colors.spotify)
      .setAuthor({ name: 'Spotify Music Queue', iconURL: 'https://cdn-icons-png.flaticon.com/512/174/174872.png' })
      .setTitle(`🎶 Queue for ${interaction.guild.name}`)
      .setDescription(description)
      .addFields(
        { name: 'Total Tracks', value: `${queue.songs.length}`, inline: true },
        { name: 'Total Queue Time', value: `~${formattedTotal}`, inline: true },
        { name: 'Loop Mode', value: queue.loopMode === 1 ? '🔂 Track' : (queue.loopMode === 2 ? '🔁 Queue' : 'Off'), inline: true }
      )
      .setFooter({ text: `Page ${page} of ${totalPages} • Use /play to queue more` });

    await interaction.reply({ embeds: [embed] });
  }
};
