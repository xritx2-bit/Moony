const { SlashCommandBuilder, EmbedBuilder, version: djsVersion } = require('discord.js');
const colors = require('../../utils/colors');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('🤖 View detailed system info and statistics for Moony'),

  async execute(interaction) {
    const client = interaction.client;
    const uptimeSec = Math.floor(process.uptime());
    const days = Math.floor(uptimeSec / 86400);
    const hours = Math.floor((uptimeSec % 86400) / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const uptimeFormatted = `${days}d ${hours}h ${minutes}m`;

    const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setAuthor({
        name: `${client.user.username} • SuperBot Diagnostics`,
        iconURL: client.user.displayAvatarURL()
      })
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: '🌐 Total Servers', value: `\`${client.guilds.cache.size.toLocaleString()}\``, inline: true },
        { name: '👥 Cached Users', value: `\`${client.users.cache.size.toLocaleString()}\``, inline: true },
        { name: '⚡ Slash Commands', value: `\`${client.commands.size}\``, inline: true },
        { name: '⏱️ Bot Uptime', value: `\`${uptimeFormatted}\``, inline: true },
        { name: '💾 Memory Usage', value: `\`${memUsage} MB / ${totalMem} GB\``, inline: true },
        { name: '⚙️ Node.js / discord.js', value: `\`${process.version} / v${djsVersion}\``, inline: true },
        { name: '💻 Host OS', value: `\`${os.type()} (${os.arch()})\``, inline: true },
        { name: '🎵 Music Engine', value: '`@discordjs/voice + Spotify Public API`', inline: true }
      )
      .setFooter({ text: 'Moony Discord SuperBot • High Availability' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
