const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolereward')
    .setDescription('🎁 Configure role rewards automatically granted when members reach a level')
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Assign a role reward for reaching a level')
        .addIntegerOption(opt => opt.setName('level').setDescription('Target level (e.g. 5, 10, 20)').setMinValue(1).setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Role to award').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove a role reward')
        .addIntegerOption(opt => opt.setName('level').setDescription('Target level').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('List all configured level role rewards')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const settings = db.getGuildSettings(interaction.guildId);
    settings.leveling.roleRewards = settings.leveling.roleRewards || {};

    if (sub === 'add') {
      const level = interaction.options.getInteger('level');
      const role = interaction.options.getRole('role');

      settings.leveling.roleRewards[level.toString()] = role.id;
      db.updateGuildSettings(interaction.guildId, settings);

      return interaction.reply(`✅ Members who reach **Level ${level}** will now automatically receive the <@&${role.id}> role!`);
    }

    if (sub === 'remove') {
      const level = interaction.options.getInteger('level');
      if (settings.leveling.roleRewards[level.toString()]) {
        delete settings.leveling.roleRewards[level.toString()];
        db.updateGuildSettings(interaction.guildId, settings);
        return interaction.reply(`🗑️ Removed role reward for **Level ${level}**.`);
      }
      return interaction.reply({ content: `❌ No role reward found for Level ${level}.`, ephemeral: true });
    }

    if (sub === 'list') {
      const rewards = settings.leveling.roleRewards;
      const levels = Object.keys(rewards).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

      if (levels.length === 0) {
        return interaction.reply({ content: 'ℹ️ No level role rewards configured yet.', ephemeral: true });
      }

      const list = levels.map(lvl => `• **Level ${lvl}:** <@&${rewards[lvl]}>`).join('\n');

      const embed = new EmbedBuilder()
        .setColor(colors.level)
        .setTitle('🎁 Level Role Rewards')
        .setDescription(list)
        .setFooter({ text: 'Add more with /rolereward add level: <number> role: @role' });

      return interaction.reply({ embeds: [embed] });
    }
  }
};
