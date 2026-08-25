const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

const JOBS = [
  { title: 'Software Engineer', desc: 'You fixed a critical bug in production and earned' },
  { title: 'Barista', desc: 'You brewed delicious caramel macchiatos and earned' },
  { title: 'DJ at Nightclub', desc: 'You hyped up the crowd with Moony Spotify beats and earned' },
  { title: 'Discord Community Manager', desc: 'You organized an epic server tournament and earned' },
  { title: 'Graphic Designer', desc: 'You crafted a gorgeous SVG server logo and earned' },
  { title: 'Space Pilot', desc: 'You safely delivered cargo to the lunar station and earned' },
  { title: 'Gourmet Chef', desc: 'You prepared a 5-course feast and earned' }
];

const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('💼 Work a shift to earn coins (10m cooldown)'),

  async execute(interaction) {
    const userData = db.getUserData(interaction.guildId, interaction.user.id);
    const now = Date.now();
    const lastWork = userData.lastWork || 0;

    if (now - lastWork < COOLDOWN_MS) {
      const nextTime = Math.floor((lastWork + COOLDOWN_MS) / 1000);
      return interaction.reply({
        content: `⏳ You are exhausted from your previous shift! Rest up and work again <t:${nextTime}:R>.`,
        ephemeral: true
      });
    }

    const earnings = Math.floor(Math.random() * (150 - 50 + 1)) + 50; // 50 to 150 coins
    const job = JOBS[Math.floor(Math.random() * JOBS.length)];

    userData.balance = (userData.balance || 0) + earnings;
    userData.lastWork = now;
    db.updateUserEconomy(interaction.guildId, interaction.user.id, userData);

    const embed = new EmbedBuilder()
      .setColor(colors.economy)
      .setTitle(`💼 Shift Complete: ${job.title}`)
      .setDescription(`${job.desc} **🪙 ${earnings} coins**!`)
      .addFields(
        { name: 'Wallet Balance', value: `\`🪙 ${userData.balance.toLocaleString()} coins\``, inline: true }
      )
      .setFooter({ text: 'Work again in 10 minutes!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
