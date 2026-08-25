const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const AIParser = require('../../utils/aiParser');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('🤖 Ask the Moony AI Assistant any question or request')
    .addStringOption(opt =>
      opt
        .setName('prompt')
        .setDescription('Your question, query, or creative request')
        .setRequired(true)
    ),

  async execute(interaction) {
    const prompt = interaction.options.getString('prompt');
    await interaction.deferReply();

    const response = await AIParser.chat(prompt, {
      userId: interaction.user.id,
      guildId: interaction.guildId
    });

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setAuthor({
        name: 'Moony AI Assistant',
        iconURL: 'https://cdn-icons-png.flaticon.com/512/4712/4712038.png'
      })
      .setTitle(`💭 ${prompt.slice(0, 100)}`)
      .setDescription(response ? response.slice(0, 4000) : 'I am thinking... Please try again shortly!')
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
