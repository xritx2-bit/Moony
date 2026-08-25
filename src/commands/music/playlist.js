const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const { getGuildQueue, createGuildQueue } = require('../../utils/musicPlayer');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('💾 Save, play, and manage your personal Spotify / Custom playlists')
    .addSubcommand(sub =>
      sub
        .setName('save')
        .setDescription('Save the current music queue as a personal playlist')
        .addStringOption(opt => opt.setName('name').setDescription('Name for your playlist').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('play')
        .setDescription('Load and play one of your saved playlists')
        .addStringOption(opt => opt.setName('name').setDescription('Playlist name to play').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('List all your saved playlists')
    )
    .addSubcommand(sub =>
      sub
        .setName('delete')
        .setDescription('Delete a saved playlist')
        .addStringOption(opt => opt.setName('name').setDescription('Playlist name to delete').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (sub === 'save') {
      const name = interaction.options.getString('name');
      const queue = getGuildQueue(interaction.guildId);

      if (!queue || queue.songs.length === 0) {
        return interaction.reply({ content: '❌ The current queue is empty. Play some songs first!', ephemeral: true });
      }

      const tracks = queue.songs.map(s => ({
        title: s.title,
        spotifyTitle: s.spotifyTitle || s.title,
        spotifyArtist: s.spotifyArtist || s.author,
        url: s.url,
        duration: s.duration,
        formattedDuration: s.formattedDuration,
        thumbnail: s.thumbnail
      }));

      db.saveUserPlaylist(userId, name, tracks);

      const embed = new EmbedBuilder()
        .setColor(colors.spotify)
        .setTitle('💾 Playlist Saved')
        .setDescription(`Successfully saved **${tracks.length} tracks** as playlist **"${name}"**!`)
        .setFooter({ text: `Play anytime with /playlist play name: ${name}` });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'play') {
      const name = interaction.options.getString('name');
      const member = interaction.member;

      if (!member.voice.channel) {
        return interaction.reply({ content: '❌ You must be in a voice channel to play playlists!', ephemeral: true });
      }

      const playlist = db.getUserPlaylist(userId, name);
      if (!playlist || !playlist.tracks || playlist.tracks.length === 0) {
        return interaction.reply({ content: `❌ Playlist **"${name}"** not found or is empty.`, ephemeral: true });
      }

      await interaction.deferReply();

      const queue = createGuildQueue(interaction.guildId, interaction.channel, member.voice.channel);
      const songObjects = playlist.tracks.map(t => ({
        ...t,
        requester: interaction.user,
        isLazy: !t.url
      }));

      queue.songs.push(...songObjects);

      const embed = new EmbedBuilder()
        .setColor(colors.spotify)
        .setTitle(`🎶 Loaded Playlist: ${playlist.name}`)
        .setDescription(`Added **${songObjects.length} tracks** to the queue!`)
        .setFooter({ text: `Requested by ${interaction.user.tag}` });

      await interaction.editReply({ embeds: [embed] });

      if (!queue.playing) {
        queue.play();
      }
      return;
    }

    if (sub === 'list') {
      const userPls = db.getUserPlaylists(userId);
      const names = Object.keys(userPls);

      if (names.length === 0) {
        return interaction.reply({ content: '📝 You don’t have any saved playlists yet. Use `/playlist save` to create one!', ephemeral: true });
      }

      const desc = names.map(n => {
        const p = userPls[n];
        return `• **${p.name}** — \`${p.tracks?.length || 0} tracks\` (Created <t:${Math.floor(p.createdAt / 1000)}:R>)`;
      }).join('\n');

      const embed = new EmbedBuilder()
        .setColor(colors.spotify)
        .setTitle('📂 Your Saved Playlists')
        .setDescription(desc)
        .setFooter({ text: 'Play any playlist with /playlist play name: <name>' });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'delete') {
      const name = interaction.options.getString('name');
      const deleted = db.deleteUserPlaylist(userId, name);

      if (deleted) {
        return interaction.reply(`🗑️ Successfully deleted playlist **"${name}"**.`);
      } else {
        return interaction.reply({ content: `❌ Playlist **"${name}"** not found.`, ephemeral: true });
      }
    }
  }
};
