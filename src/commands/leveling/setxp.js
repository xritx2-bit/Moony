const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setxp')
    .setDescription('⚙️ Add or adjust XP for a member')
    .addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount of XP to add').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    const result = db.addXp(interaction.guildId, targetUser.id, amount);

    const embed = new EmbedBuilder()
      .setColor(colors.level)
      .setTitle('⚙️ XP Updated')
      .setDescription(`Added **${amount.toLocaleString()} XP** to <@${targetUser.id}>.\n\n• **New Total XP:** \`${result.user.xp.toLocaleString()}\`\n• **New Level:** \`${result.user.level}\``)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
