const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType
} = require('discord.js');
const colors = require('../../utils/colors');

const CATEGORIES = {
  music: {
    emoji: '🎵',
    name: 'Music & Spotify',
    desc: 'Spotify-grade music streaming with rich interactive controls, custom playlists & 24/7 web radio',
    commands: [
      { name: '/play <query>', desc: 'Stream songs, Spotify links (track/album/playlist), or YouTube URLs' },
      { name: '/pause & /resume', desc: 'Pause or unpause music playback' },
      { name: '/skip & /previous', desc: 'Skip to next track or jump back to previous song' },
      { name: '/queue', desc: 'View current playlist queue with durations and ETA' },
      { name: '/nowplaying', desc: 'Open the interactive Spotify visual controller' },
      { name: '/loop [mode]', desc: 'Toggle track loop, queue loop, or normal playback' },
      { name: '/shuffle', desc: 'Shuffle all upcoming queued tracks' },
      { name: '/volume <percent>', desc: 'Set playback volume (1-150%)' },
      { name: '/stop', desc: 'Stop music, clear queue, and leave voice channel' },
      { name: '/radio <station>', desc: 'Play 24/7 web radio (Lo-Fi, Chill, Synthwave, EDM, Pop, Anime)' },
      { name: '/playlist <save|play|list|delete>', desc: 'Manage your custom playlists' }
    ]
  },
  moderation: {
    emoji: '🛡️',
    name: 'Moderation & Safety',
    desc: 'Automated and manual moderation suite with audit logging',
    commands: [
      { name: '/ban <user> [reason] [delete_days]', desc: 'Ban a member with optional purge days' },
      { name: '/kick <user> [reason]', desc: 'Kick a member from the server' },
      { name: '/timeout <user> <duration> [reason]', desc: 'Mute/timeout a member (e.g. 5m, 1h, 1d)' },
      { name: '/untimeout <user>', desc: 'Remove timeout early' },
      { name: '/warn <user> <reason>', desc: 'Issue an official recorded warning' },
      { name: '/warnings <user>', desc: 'View full warning history for a member' },
      { name: '/clearwarns <user>', desc: 'Wipe all warnings for a member' },
      { name: '/purge <amount> [user] [filter]', desc: 'Bulk clean messages with filters' },
      { name: '/lock [reason]', desc: 'Lock down current channel from @everyone' },
      { name: '/unlock', desc: 'Unlock current channel' },
      { name: '/slowmode <seconds>', desc: 'Set channel rate limit / cooldown' },
      { name: '/automod', desc: 'Configure Anti-Spam, Anti-Link, and filtered words' }
    ]
  },
  leveling: {
    emoji: '✨',
    name: 'Leveling & Gamification',
    desc: 'SVG Canvas rank cards, leaderboards, and auto role rewards',
    commands: [
      { name: '/rank [user]', desc: 'Generate sleek graphical SVG Rank Card' },
      { name: '/leaderboard [limit]', desc: 'Top XP earners in the server' },
      { name: '/setxp <user> <amount>', desc: 'Admin command to grant or adjust XP' },
      { name: '/rolereward <add|remove|list>', desc: 'Configure milestone level role rewards' }
    ]
  },
  tickets: {
    emoji: '🎫',
    name: 'Ticket Desk',
    desc: 'One-click private ticket support channels with transcripts',
    commands: [
      { name: '/ticket-panel', desc: 'Deploy interactive ticket creation buttons in a channel' }
    ]
  },
  economy: {
    emoji: '💰',
    name: 'Economy & Casino',
    desc: 'Virtual economy with daily rewards, jobs, transfers, and casino games',
    commands: [
      { name: '/balance [user]', desc: 'Check wallet and bank coin balance' },
      { name: '/daily', desc: 'Claim daily 250 coins reward' },
      { name: '/work', desc: 'Work a random shift every 10 minutes' },
      { name: '/pay <user> <amount>', desc: 'Send coins to another member' },
      { name: '/gamble <coinflip|slots>', desc: 'Bet coins on coinflip or slot machine' }
    ]
  },
  feeds: {
    emoji: '📡',
    name: 'Automated Feeds',
    desc: 'Real-time background posters for YouTube, Reddit, and RSS feeds',
    commands: [
      { name: '/feed add <type> <source> <channel>', desc: 'Subscribe to YouTube/Reddit/RSS' },
      { name: '/feed list', desc: 'List active auto-poster subscriptions' },
      { name: '/feed remove <id>', desc: 'Delete an auto-poster subscription' }
    ]
  },
  ai: {
    emoji: '🤖',
    name: 'AI Assistant',
    desc: 'Intelligent AI assistant powered by Gemini / OpenAI',
    commands: [
      { name: '/ask <prompt>', desc: 'Chat and ask questions with Moony AI' },
      { name: '/summarize [messages]', desc: 'AI summary of recent channel discussion' }
    ]
  },
  utility: {
    emoji: '🛠️',
    name: 'Utility & Tools',
    desc: 'Server tools, avatar inspection, reminders, and self roles',
    commands: [
      { name: '/help', desc: 'Show this interactive help center' },
      { name: '/ping', desc: 'Display bot latency and voice ping' },
      { name: '/botinfo', desc: 'View bot statistics and system diagnostics' },
      { name: '/serverinfo', desc: 'View server overview and stats' },
      { name: '/userinfo [user]', desc: 'Inspect member metadata and permissions' },
      { name: '/avatar [user]', desc: 'View user and server avatars in HD' },
      { name: '/remind <time> <message>', desc: 'Set automated reminders (e.g. 10m, 2h)' },
      { name: '/reactionrole', desc: 'Create button-based self-assignable role panels' }
    ]
  },
  admin: {
    emoji: '⚙️',
    name: 'Server Admin & Setup',
    desc: 'Configure welcome cards, mod logs, and system settings',
    commands: [
      { name: '/setup', desc: 'All-in-one interactive setup guide' },
      { name: '/setwelcome <channel> [message] [auto_role]', desc: 'Set welcome channel & canvas cards' },
      { name: '/setgoodbye <channel> [message]', desc: 'Set goodbye notification channel' },
      { name: '/setmodlog <channel>', desc: 'Configure security audit log channel' }
    ]
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📖 Explore all commands and features in Moony SuperBot'),

  async execute(interaction) {
    const mainEmbed = new EmbedBuilder()
      .setColor(colors.primary)
      .setAuthor({
        name: 'Moony SuperBot • Help Center',
        iconURL: 'https://cdn-icons-png.flaticon.com/512/174/174872.png'
      })
      .setTitle('✨ Welcome to Moony!')
      .setDescription(
        `**Moony** is the ultimate all-in-one Discord SuperBot featuring Spotify-Grade Music, Auto-Moderation, Gamification & Leveling, Tickets, Automated Feeds, and AI.\n\n` +
        `**Select a category below** to view all available commands and detailed usage!`
      )
      .addFields(
        Object.entries(CATEGORIES).map(([key, cat]) => ({
          name: `${cat.emoji} ${cat.name}`,
          value: cat.desc,
          inline: true
        }))
      )
      .setFooter({ text: 'Use the dropdown menu below to navigate categories' })
      .setTimestamp();

    const selectOptions = Object.entries(CATEGORIES).map(([key, cat]) => ({
      label: cat.name,
      description: cat.desc.slice(0, 50) + '...',
      value: key,
      emoji: cat.emoji
    }));

    const menu = new StringSelectMenuBuilder()
      .setCustomId('help_select')
      .setPlaceholder('📂 Select a Feature Category...')
      .addOptions(selectOptions);

    const row = new ActionRowBuilder().addComponents(menu);

    const response = await interaction.reply({
      embeds: [mainEmbed],
      components: [row],
      fetchReply: true
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120000
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ Use `/help` to open your own menu.', ephemeral: true });
      }

      const selected = i.values[0];
      const cat = CATEGORIES[selected];

      if (!cat) return;

      const categoryEmbed = new EmbedBuilder()
        .setColor(selected === 'music' ? colors.spotify : colors.primary)
        .setTitle(`${cat.emoji} ${cat.name} Commands`)
        .setDescription(
          `**${cat.desc}**\n\n` +
          cat.commands.map(c => `• **\`${c.name}\`**\n  ↳ ${c.desc}`).join('\n\n')
        )
        .setFooter({ text: 'Moony Help System • Select another category anytime' })
        .setTimestamp();

      await i.update({ embeds: [categoryEmbed] });
    });

    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });
  }
};
