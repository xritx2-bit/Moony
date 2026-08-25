const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const db = require('../../database/db');
const AIParser = require('../../utils/aiParser');
const colors = require('../../utils/colors');
const Logger = require('../../utils/logger');
const config = require('../../config');
const { createGuildQueue, getGuildQueue } = require('../../utils/musicPlayer');
const SpotifyResolver = require('../../utils/spotifyResolver');

// In-memory spam, cooldown and DM tracking
const userMessageTimes = new Map(); // userId -> timestamp[]
const userXpCooldowns = new Map();  // `${guildId}_${userId}` -> timestamp
const dmGreetedUsers = new Set();   // Set<userId>

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;

    // ==========================================
    // 1. DIRECT MESSAGES (DM) HANDLER
    // ==========================================
    if (!message.guild || message.channel.type === ChannelType.DM) {
      const userId = message.author.id;
      const content = message.content.trim();
      const contentLower = content.toLowerCase();

      // Check if greeting or first DM
      const isGreeting = (
        contentLower === 'hi' ||
        contentLower === 'hello' ||
        contentLower === 'hey' ||
        contentLower === 'heyy' ||
        contentLower === 'heyyy' ||
        contentLower === 'start' ||
        contentLower === 'help' ||
        contentLower === 'who are you' ||
        contentLower === 'info' ||
        !dmGreetedUsers.has(userId)
      );

      if (isGreeting && (!dmGreetedUsers.has(userId) || contentLower.length <= 6)) {
        dmGreetedUsers.add(userId);
        return message.reply(AIParser.welcomeMessage).catch(err => {
          Logger.error('Failed to send DM response:', err.message);
        });
      }

      // If user asks a question in DMs, use real-time Web Search / AI
      try {
        await message.channel.sendTyping().catch(() => {});
        const answer = await AIParser.chat(content, { userId });
        return message.reply(answer).catch(err => {
          Logger.error('Failed to send DM AI answer:', err.message);
        });
      } catch (dmErr) {
        Logger.error('DM processing error:', dmErr.message);
      }
      return;
    }

    const guildId = message.guild.id;
    const userId = message.author.id;
    const settings = db.getGuildSettings(guildId);

    // ==========================================
    // 2. AUTOMOD SYSTEM CHECKS (GUILD)
    // ==========================================
    const isMod = message.member?.permissions.has(PermissionFlagsBits.ManageMessages);

    if (!isMod && settings.automod) {
      // (a) Anti-Link / Discord Invites
      if (settings.automod.antiLink) {
        const linkRegex = /(https?:\/\/[^\s]+|discord\.(gg|io|me|li)\/[^\s]+)/i;
        if (linkRegex.test(message.content)) {
          await message.delete().catch(() => {});
          const warnMsg = await message.channel.send(`⚠️ <@${userId}>, links and server invites are not allowed here!`).catch(() => null);
          if (warnMsg) setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
          return;
        }
      }

      // (b) Bad Words Filter
      if (settings.automod.badWords && settings.automod.badWords.length > 0) {
        const contentLower = message.content.toLowerCase();
        const hasBadWord = settings.automod.badWords.some(w => contentLower.includes(w));
        if (hasBadWord) {
          await message.delete().catch(() => {});
          const warnMsg = await message.channel.send(`🚫 <@${userId}>, your message contained a prohibited word and was removed.`).catch(() => null);
          if (warnMsg) setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
          return;
        }
      }

      // (c) Mass Mentions
      const maxMentions = settings.automod.maxMentions || 5;
      if (message.mentions.users.size > maxMentions) {
        await message.delete().catch(() => {});
        const warnMsg = await message.channel.send(`⚠️ <@${userId}>, mass mentions are prohibited!`).catch(() => null);
        if (warnMsg) setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
        return;
      }

      // (d) Anti-Spam (More than 5 messages in 3 seconds)
      if (settings.automod.antiSpam) {
        const now = Date.now();
        const userTimestamps = userMessageTimes.get(userId) || [];
        const recentTimestamps = userTimestamps.filter(t => now - t < 3000);
        recentTimestamps.push(now);
        userMessageTimes.set(userId, recentTimestamps);

        if (recentTimestamps.length > 5) {
          await message.delete().catch(() => {});
          if (message.member?.moderatable) {
            await message.member.timeout(60000, 'Automod: Rapid Message Spamming').catch(() => {});
          }
          const warnMsg = await message.channel.send(`🚨 <@${userId}> has been muted for 1 minute due to spamming!`).catch(() => null);
          if (warnMsg) setTimeout(() => warnMsg.delete().catch(() => {}), 8000);
          return;
        }
      }
    }

    // ==========================================
    // 3. LEVELING & XP SYSTEM (GUILD)
    // ==========================================
    if (settings.leveling?.enabled) {
      const cooldownKey = `${guildId}_${userId}`;
      const lastXpTime = userXpCooldowns.get(cooldownKey) || 0;
      const now = Date.now();

      if (now - lastXpTime >= 60000) { // 60s cooldown
        userXpCooldowns.set(cooldownKey, now);
        const xpGain = Math.floor(Math.random() * 11) + 15; // 15 to 25 XP
        const { leveledUp, newLevel } = db.addXp(guildId, userId, xpGain);

        if (leveledUp) {
          // Check for Role Rewards
          const roleRewards = settings.leveling.roleRewards || {};
          const rewardRoleId = roleRewards[newLevel.toString()];
          if (rewardRoleId) {
            const role = message.guild.roles.cache.get(rewardRoleId);
            if (role && message.member) {
              message.member.roles.add(role).catch(() => {});
            }
          }

          const targetChannel = settings.leveling.channelId
            ? message.guild.channels.cache.get(settings.leveling.channelId) || message.channel
            : message.channel;

          const levelEmbed = new EmbedBuilder()
            .setColor(colors.level)
            .setTitle('🎉 Level Up!')
            .setDescription(`Congratulations <@${userId}>! You advanced to **Level ${newLevel}**! ✨`)
            .setFooter({ text: 'Keep chatting to earn more XP and climb the leaderboard!' });

          targetChannel.send({ embeds: [levelEmbed] }).catch(() => {});
        }
      }
    }

    // ==========================================
    // 4. NATURAL LANGUAGE AI & PREFIX PARSER (GUILD)
    // ==========================================
    const botMention = new RegExp(`^<@!?${client.user.id}>`);
    const isBotMentioned = botMention.test(message.content);
    const startsWithPrefix = message.content.startsWith(config.prefix || '!');

    if (isBotMentioned || (startsWithPrefix && message.content.length > 1)) {
      const cleanContent = message.content.replace(botMention, '').replace(new RegExp(`^\\${config.prefix}`), '').trim();
      if (!cleanContent) return;

      const parsed = AIParser.parseCommandIntent(cleanContent);

      // Handle direct parsed intent if applicable
      if (parsed.intent === 'music_play' && parsed.query) {
        if (!message.member.voice.channel) {
          return message.reply('❌ You must join a voice channel first to play music!').catch(() => {});
        }
        const queue = createGuildQueue(guildId, message.channel, message.member.voice.channel);
        const track = await SpotifyResolver.searchYouTubeTrack(parsed.query, message.author);
        if (track) {
          queue.songs.push(track);
          await message.reply(`🎵 Queued **${track.title}** via AI natural command!`).catch(() => {});
          if (!queue.playing) queue.play();
        } else {
          await message.reply(`❌ Could not find track for \`${parsed.query}\``).catch(() => {});
        }
        return;
      }

      if (parsed.intent === 'music_skip') {
        const queue = getGuildQueue(guildId);
        if (queue) {
          queue.skip();
          return message.reply('⏭️ Skipped current song via AI trigger.').catch(() => {});
        }
      }

      if (parsed.intent === 'music_pause') {
        const queue = getGuildQueue(guildId);
        if (queue) {
          queue.pause();
          return message.reply('⏸️ Paused music playback.').catch(() => {});
        }
      }

      if (parsed.intent === 'music_resume') {
        const queue = getGuildQueue(guildId);
        if (queue) {
          queue.resume();
          return message.reply('▶️ Resumed music playback.').catch(() => {});
        }
      }

      if (parsed.intent === 'chat' || parsed.intent.startsWith('mod_')) {
        await message.channel.sendTyping().catch(() => {});
        const reply = await AIParser.chat(cleanContent, { userId, guildId });
        await message.reply({ content: reply ? reply.slice(0, 2000) : 'I hear you!' }).catch(() => {});
      }
    }
  }
};
