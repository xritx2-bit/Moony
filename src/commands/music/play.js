const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createGuildQueue } = require('../../utils/musicPlayer');
const SpotifyResolver = require('../../utils/spotifyResolver');
const colors = require('../../utils/colors');
const Logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('🎵 Play any song, Spotify link, YouTube URL, or playlist')
    .addStringOption(opt =>
      opt
        .setName('query')
        .setDescription('Song title, artist, Spotify link (track/album/playlist), or YouTube URL')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    try {
      const focused = interaction.options.getFocused();
      if (!focused || focused.trim().length === 0 || SpotifyResolver.isSpotifyUrl(focused)) {
        return interaction.respond([]).catch(() => {});
      }

      const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([]), 2000));
      const searchPromise = SpotifyResolver.getSearchSuggestions(focused, 7);
      const suggestions = await Promise.race([searchPromise, timeoutPromise]);

      await interaction.respond(suggestions || []).catch(() => {});
    } catch (e) {
      await interaction.respond([]).catch(() => {});
    }
  },

  async execute(interaction) {
    const query = interaction.options.getString('query');
    const member = interaction.member;

    if (!member.voice.channel) {
      return interaction.reply({
        content: '❌ You must join a voice channel first to play music!',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const queue = createGuildQueue(interaction.guildId, interaction.channel, member.voice.channel);

    try {
      // 1. Spotify URL
      if (SpotifyResolver.isSpotifyUrl(query)) {
        const tracks = await SpotifyResolver.resolveSpotify(query, interaction.user);
        if (!tracks || tracks.length === 0) {
          return interaction.editReply({
            content: '❌ Could not load or resolve tracks from this Spotify link.'
          });
        }

        if (tracks.length === 1) {
          queue.songs.push(tracks[0]);
          const embed = new EmbedBuilder()
            .setColor(colors.spotify)
            .setAuthor({ name: 'Spotify Track Added', iconURL: 'https://cdn-icons-png.flaticon.com/512/174/174872.png' })
            .setTitle(`🎵 ${tracks[0].spotifyTitle || tracks[0].title}`)
            .setDescription(`**Artist:** ${tracks[0].spotifyArtist || 'Spotify Artist'}\n**Duration:** \`${tracks[0].formattedDuration}\`\n**Position in Queue:** #${queue.songs.length}`)
            .setThumbnail(tracks[0].thumbnail);

          await interaction.editReply({ embeds: [embed] });
        } else {
          // Entire Album / Playlist
          queue.songs.push(...tracks);
          const embed = new EmbedBuilder()
            .setColor(colors.spotify)
            .setAuthor({ name: 'Spotify Playlist Queued', iconURL: 'https://cdn-icons-png.flaticon.com/512/174/174872.png' })
            .setTitle(`🎶 Queued ${tracks.length} Tracks from Spotify`)
            .setDescription(`All tracks have been added to the queue! Playing starts immediately.`)
            .setFooter({ text: `Requested by ${interaction.user.tag}` });

          await interaction.editReply({ embeds: [embed] });
        }

        if (!queue.playing) {
          queue.play();
        }
        return;
      }

      // 2. Direct Audio Stream / Web Radio
      if (SpotifyResolver.isDirectAudioUrl(query)) {
        const track = {
          title: 'Direct Audio Stream / Web Radio',
          url: query,
          duration: 0,
          formattedDuration: 'Live Stream',
          thumbnail: 'https://cdn-icons-png.flaticon.com/512/174/174872.png',
          author: 'Internet Stream',
          requester: interaction.user,
          isDirectAudio: true
        };

        queue.songs.push(track);
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(colors.spotify)
              .setTitle('📻 Playing Live Audio Stream')
              .setDescription(`Streaming audio from: \`${query}\``)
          ]
        });

        if (!queue.playing) {
          queue.play();
        }
        return;
      }

      // 3. YouTube / General Query
      const track = await SpotifyResolver.searchYouTubeTrack(query, interaction.user);
      if (!track) {
        return interaction.editReply({
          content: `❌ No results found for: \`${query}\`. Try a different song or artist!`
        });
      }

      queue.songs.push(track);

      if (queue.songs.length === 1 && !queue.playing) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(colors.spotify)
              .setAuthor({ name: 'Spotify Music Engine', iconURL: 'https://cdn-icons-png.flaticon.com/512/174/174872.png' })
              .setTitle(`🎵 ${track.title}`)
              .setDescription(`Starting playback in <#${member.voice.channel.id}>...`)
              .setThumbnail(track.thumbnail)
          ]
        });
        queue.play();
      } else {
        const embed = new EmbedBuilder()
          .setColor(colors.spotify)
          .setAuthor({ name: 'Track Queued', iconURL: 'https://cdn-icons-png.flaticon.com/512/174/174872.png' })
          .setTitle(`🎵 ${track.title}`)
          .setDescription(`**Artist / Channel:** ${track.author}\n**Duration:** \`${track.formattedDuration}\`\n**Position in Queue:** #${queue.songs.length}`)
          .setThumbnail(track.thumbnail)
          .setFooter({ text: `Requested by ${interaction.user.tag}` });

        await interaction.editReply({ embeds: [embed] });
        if (!queue.playing) {
          queue.play();
        }
      }
    } catch (err) {
      Logger.error('Play command error:', err.message);
      await interaction.editReply({
        content: `❌ Playback error: ${err.message}`
      });
    }
  }
};
