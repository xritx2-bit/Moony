const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gamble')
    .setDescription('🎲 Bet coins on coinflip or slot machine')
    .addSubcommand(sub =>
      sub
        .setName('coinflip')
        .setDescription('Flip a coin (Heads or Tails)')
        .addIntegerOption(opt => opt.setName('bet').setDescription('Amount to bet').setMinValue(10).setRequired(true))
        .addStringOption(opt =>
          opt
            .setName('choice')
            .setDescription('Heads or Tails')
            .setRequired(true)
            .addChoices({ name: 'Heads', value: 'heads' }, { name: 'Tails', value: 'tails' })
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('slots')
        .setDescription('Spin the 3-reel slot machine (3x match pays 4x, 2x match pays 1.5x)')
        .addIntegerOption(opt => opt.setName('bet').setDescription('Amount to bet').setMinValue(10).setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const bet = interaction.options.getInteger('bet');
    const userData = db.getUserData(interaction.guildId, interaction.user.id);

    if ((userData.balance || 0) < bet) {
      return interaction.reply({
        content: `❌ You do not have enough coins! Your wallet: **🪙 ${userData.balance || 0} coins**.`,
        ephemeral: true
      });
    }

    if (sub === 'coinflip') {
      const choice = interaction.options.getString('choice');
      const flip = Math.random() < 0.5 ? 'heads' : 'tails';
      const won = choice === flip;

      if (won) {
        userData.balance += bet;
      } else {
        userData.balance -= bet;
      }
      db.updateUserEconomy(interaction.guildId, interaction.user.id, userData);

      const embed = new EmbedBuilder()
        .setColor(won ? colors.success : colors.danger)
        .setTitle(`🪙 Coinflip Result: ${flip.toUpperCase()}`)
        .setDescription(
          won
            ? `🎉 **You won!** The coin landed on **${flip}** and you earned **+🪙 ${bet.toLocaleString()} coins**!`
            : `💀 **You lost!** The coin landed on **${flip}** and you lost **-🪙 ${bet.toLocaleString()} coins**.`
        )
        .addFields({ name: 'New Balance', value: `\`🪙 ${userData.balance.toLocaleString()} coins\`` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'slots') {
      const items = ['🍒', '🍋', '🍇', '💎', '7️⃣'];
      const r1 = items[Math.floor(Math.random() * items.length)];
      const r2 = items[Math.floor(Math.random() * items.length)];
      const r3 = items[Math.floor(Math.random() * items.length)];

      let multiplier = 0;
      if (r1 === r2 && r2 === r3) {
        multiplier = r1 === '💎' || r1 === '7️⃣' ? 5 : 3;
      } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        multiplier = 1.5;
      }

      const profit = Math.floor(bet * multiplier);
      const won = multiplier > 0;

      if (won) {
        userData.balance += (profit - bet);
      } else {
        userData.balance -= bet;
      }
      db.updateUserEconomy(interaction.guildId, interaction.user.id, userData);

      const embed = new EmbedBuilder()
        .setColor(won ? colors.success : colors.danger)
        .setTitle('🎰 Moony Casino Slots')
        .setDescription(
          `┌──────────────┐\n` +
          `│  ${r1}  │  ${r2}  │  ${r3}  │\n` +
          `└──────────────┘\n\n` +
          (won
            ? `🎉 **JACKPOT!** You matched and won **+🪙 ${profit.toLocaleString()} coins** (${multiplier}x)!`
            : `💀 **No match!** You lost **-🪙 ${bet.toLocaleString()} coins**. Better luck next spin!`)
        )
        .addFields({ name: 'New Balance', value: `\`🪙 ${userData.balance.toLocaleString()} coins\`` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  }
};
