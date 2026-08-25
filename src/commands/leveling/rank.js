const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/db');
const CanvasRank = require('../../utils/canvasRank');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('✨ View your or another member\'s XP rank card')
    .addUserOption(opt => opt.setName('user').setDescription('Member to inspect').setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user') || interaction.user;
    const userData = db.getUserData(interaction.guildId, targetUser.id);
    const rank = db.getUserRank(interaction.guildId, targetUser.id);

    // Current level and needed XP: level = floor(0.1 * sqrt(xp)) => xp = (level / 0.1)^2 = (level * 10)^2
    const currentLevel = userData.level;
    const nextLevel = currentLevel + 1;
    const nextLevelXp = Math.pow(nextLevel * 10, 2);

    const avatarUrl = targetUser.displayAvatarURL({ extension: 'png', size: 256 });
    const attachment = CanvasRank.createRankCardAttachment(
      targetUser,
      rank,
      currentLevel,
      userData.xp,
      nextLevelXp,
      avatarUrl
    );

    await interaction.editReply({ files: [attachment] });
  }
};
