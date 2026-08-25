const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');
const colors = require('../../utils/colors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('🎭 Create interactive button-based self-assignable role panels')
    .addStringOption(opt => opt.setName('title').setDescription('Embed title for role selection panel').setRequired(true))
    .addRoleOption(opt => opt.setName('role1').setDescription('First selectable role').setRequired(true))
    .addStringOption(opt => opt.setName('emoji1').setDescription('Emoji for role 1 (e.g. 🎮 or 🔔)').setRequired(false))
    .addRoleOption(opt => opt.setName('role2').setDescription('Second selectable role').setRequired(false))
    .addStringOption(opt => opt.setName('emoji2').setDescription('Emoji for role 2').setRequired(false))
    .addRoleOption(opt => opt.setName('role3').setDescription('Third selectable role').setRequired(false))
    .addStringOption(opt => opt.setName('emoji3').setDescription('Emoji for role 3').setRequired(false))
    .addRoleOption(opt => opt.setName('role4').setDescription('Fourth selectable role').setRequired(false))
    .addStringOption(opt => opt.setName('emoji4').setDescription('Emoji for role 4').setRequired(false))
    .addChannelOption(opt =>
      opt
        .setName('channel')
        .setDescription('Channel to post the role panel in')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const title = interaction.options.getString('title');
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    const roles = [];
    for (let i = 1; i <= 4; i++) {
      const r = interaction.options.getRole(`role${i}`);
      const em = interaction.options.getString(`emoji${i}`);
      if (r) {
        roles.push({ role: r, emoji: em || '✨' });
      }
    }

    if (roles.length === 0) {
      return interaction.reply({ content: '❌ Please specify at least one role.', ephemeral: true });
    }

    const desc = roles.map(r => `• ${r.emoji} <@&${r.role.id}>`).join('\n');

    const embed = new EmbedBuilder()
      .setColor(colors.primary)
      .setTitle(`🎭 ${title}`)
      .setDescription(`Click a button below to claim or remove a role:\n\n${desc}`)
      .setFooter({ text: 'Moony Reaction Roles • Toggle roles on demand' })
      .setTimestamp();

    const row = new ActionRowBuilder();
    for (const r of roles) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`rr_role_${r.role.id}`)
          .setLabel(r.role.name.slice(0, 50))
          .setEmoji(r.emoji)
          .setStyle(ButtonStyle.Secondary)
      );
    }

    await targetChannel.send({ embeds: [embed], components: [row] });

    await interaction.reply({
      content: `✅ Reaction role panel dispatched to <#${targetChannel.id}>!`,
      ephemeral: true
    });
  }
};
