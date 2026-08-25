const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createGuildQueue } = require('../../utils/musicPlayer');
const config = require('../../config');
const colors = require('../../utils/colors');

const STATIONS = [
  { name: '☕ Lo-Fi Chill Beats', value: 'lofi', url: config.radioStations.lofi, desc: 'Cozy study and relaxation lo-fi hip hop' },
  { name: '🍃 Chill & Ambient', value: 'chill', url: config.radioStations.chill, desc: 'Smooth ambient and relaxing instrumental' },
  { name: '🌆 80s Synthwave / Cyberpunk', value: 'synthwave', url: config.radioStations.synthwave, desc: 'Retro synthwave and electro vibes' },
  { name: '🎮 Gaming & EDM', value: 'gaming', url: config.radioStations.gaming, desc: 'High-energy electronic beats for gaming' },
  { name: '✨ Pop & Top Hits', value: 'pop', url: config.radioStations.pop, desc: 'International chart toppers and upbeat hits' },
  { name: '🌸 Anime & J-Pop', value: 'anime', url: config.radioStations.anime, desc: 'Anime soundtracks, openings, and J-Pop' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('📻 Play 24/7 high-fidelity live web radio stations')
    .addStringOption(opt =>
      opt
        .setName('station')
        .setDescription('Select radio genre / station')
        .setRequired(true)
        .addChoices(...STATIONS.map(s => ({ name: s.name, value: s.value })))
    ),

  async execute(interaction) {
    const member = interaction.member;
    if (!member.voice.channel) {
      return interaction.reply({
        content: '❌ You must join a voice channel first to start radio streaming!',
        ephemeral: true
      });
    }

    const stationKey = interaction.options.getString('station');
    const station = STATIONS.find(s => s.value === stationKey) || STATIONS[0];

    await interaction.deferReply();

    const queue = createGuildQueue(interaction.guildId, interaction.channel, member.voice.channel);
    queue.stay247 = true;

    // Clear existing queue and inject radio track
    queue.songs = [{
      title: station.name,
      url: station.url,
      duration: 0,
      formattedDuration: '24/7 Live Stream',
      thumbnail: 'https://cdn-icons-png.flaticon.com/512/3074/3074767.png',
      author: 'Moony 24/7 Radio Network',
      requester: interaction.user,
      isDirectAudio: true
    }];

    const embed = new EmbedBuilder()
      .setColor(colors.spotify)
      .setTitle(`📻 Now Streaming: ${station.name}`)
      .setDescription(
        `**Station:** ${station.desc}\n` +
        `**Mode:** 24/7 Live Stream (Auto-reconnect enabled)\n` +
        `**Voice Channel:** <#${member.voice.channel.id}>`
      )
      .setFooter({ text: 'Moony Radio Engine • Continuous non-stop music' });

    await interaction.editReply({ embeds: [embed] });
    queue.play();
  }
};
