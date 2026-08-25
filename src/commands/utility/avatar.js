const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('🖼️ View the high-definition avatar of a member')
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const pngUrl = targetUser.displayAvatarURL({ extension: 'png', size: 1024 });
    const jpgUrl = targetUser.displayAvatarURL({ extension: 'jpg', size: 1024 });
    const webpUrl = targetUser.displayAvatarURL({ extension: 'webp', size: 1024 });

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle(`🖼️ ${targetUser.username}'s Avatar`)
      .setImage(pngUrl)
      .setFooter({ text: `Requested by ${interaction.user.tag}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('PNG').setStyle(ButtonStyle.Link).setURL(pngUrl),
      new ButtonBuilder().setLabel('JPG').setStyle(ButtonStyle.Link).setURL(jpgUrl),
      new ButtonBuilder().setLabel('WEBP').setStyle(ButtonStyle.Link).setURL(webpUrl)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
