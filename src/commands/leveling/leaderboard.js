const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏆 Display the server XP & Level Leaderboard')
    .addIntegerOption(opt =>
      opt
        .setName('limit')
        .setDescription('Number of top members to display (5-25)')
        .setMinValue(5)
        .setMaxValue(25)
        .setRequired(false)
    ),

  async execute(interaction) {
    const limit = interaction.options.getInteger('limit') || 10;
    const topUsers = db.getLeaderboard(interaction.guildId, limit);

    if (topUsers.length === 0) {
      return interaction.reply({
        content: '📊 No members have earned XP yet. Start chatting to gain XP!',
        ephemeral: true
      });
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = topUsers.map((u, idx) => {
      const medal = medals[idx] || `\`#${idx + 1}\``;
      return `${medal} <@${u.userId}> — **Level ${u.level}** (\`${u.xp.toLocaleString()} XP\`)`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor(colors.level)
      .setTitle(`🏆 ${interaction.guild.name} • XP Leaderboard`)
      .setDescription(lines)
      .setFooter({ text: 'Moony Gamification Engine • Rank up by being active in chat & voice' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
