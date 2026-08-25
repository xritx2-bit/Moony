const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Check bot latency and API responsiveness'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '🏓 Measuring ping...', fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const wsPing = Math.round(interaction.client.ws.ping);

    const embed = new EmbedBuilder()
      .setColor(roundtrip < 200 ? colors.success : colors.warning)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '📡 Gateway Ping', value: `\`${wsPing} ms\``, inline: true },
        { name: '⚡ Roundtrip Latency', value: `\`${roundtrip} ms\``, inline: true },
        { name: '🟢 Status', value: 'Operational', inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
  }
};
