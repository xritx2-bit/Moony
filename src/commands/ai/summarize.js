const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const AIParser = require('../../utils/aiParser');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('summarize')
    .setDescription('📝 Summarize recent conversation in the current channel using AI')
    .addIntegerOption(opt =>
      opt
        .setName('messages')
        .setDescription('Number of recent messages to analyze (10-50)')
        .setMinValue(10)
        .setMaxValue(50)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ReadMessageHistory),

  async execute(interaction) {
    const limit = interaction.options.getInteger('messages') || 25;
    await interaction.deferReply();

    const fetched = await interaction.channel.messages.fetch({ limit });
    const formattedHistory = fetched
      .reverse()
      .filter(m => !m.author.bot && m.content.trim().length > 0)
      .map(m => `${m.author.username}: ${m.cleanContent}`)
      .join('\n');

    if (!formattedHistory || formattedHistory.length === 0) {
      return interaction.editReply({ content: '⚠️ Not enough recent human conversation to summarize.' });
    }

    const prompt = `Please summarize the following Discord channel discussion concisely into key takeaways and bullet points:\n\n${formattedHistory}`;
    const summary = await AIParser.chat(prompt);

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle(`📝 Channel Conversation Summary (Last ${limit} Messages)`)
      .setDescription(summary || 'Could not generate summary.')
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
