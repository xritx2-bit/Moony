const axios = require('axios');
const config = require('../config');
const Logger = require('./logger');

const MOONY_WELCOME = `🌙 **Heyyy! I'm Moony!** 💙

Thanks for messaging me! I'm a cute little Discord bot created by **RixiePlayz** ✨

👑 **My Creator:** RixiePlayz
🎮 **He loves:** Minecraft, Free Fire & gaming
💫 **Made with:** lots of code, chaos, and a little moon magic 🌙

If you need anything, just talk to me! 💙
— **Moony** 🌙`;

class AIParser {
  static get welcomeMessage() {
    return MOONY_WELCOME;
  }

  /**
   * Parse natural language string to extract intended action & arguments
   */
  static parseCommandIntent(text) {
    const clean = text.toLowerCase().trim();

    // 1. Music Play
    const playMatch = clean.match(/(?:play|stream|put on)\s+(.+)/i);
    if (playMatch) {
      return { intent: 'music_play', query: playMatch[1].trim() };
    }
    if (clean.includes('skip song') || clean.includes('skip track') || clean === 'skip' || clean === 'next song') {
      return { intent: 'music_skip' };
    }
    if (clean.includes('pause music') || clean === 'pause') {
      return { intent: 'music_pause' };
    }
    if (clean.includes('resume music') || clean === 'resume') {
      return { intent: 'music_resume' };
    }
    if (clean.includes('stop music') || clean.includes('leave voice') || clean === 'stop') {
      return { intent: 'music_stop' };
    }

    // 2. Moderation Purge
    const purgeMatch = clean.match(/(?:purge|clear|delete)\s+(\d+)\s*(?:messages?)?/i);
    if (purgeMatch) {
      return { intent: 'mod_purge', amount: parseInt(purgeMatch[1], 10) };
    }

    // 3. Moderation Lock/Unlock
    if (clean.includes('lock channel') || clean.includes('lock this channel') || clean === 'lock') {
      return { intent: 'mod_lock' };
    }
    if (clean.includes('unlock channel') || clean.includes('unlock this channel') || clean === 'unlock') {
      return { intent: 'mod_unlock' };
    }

    // 4. Moderation Mute / Timeout
    const muteMatch = clean.match(/(?:mute|timeout)\s+<@!?(\d+)>\s*(?:for\s*(\d+[smhd]))?\s*(?:reason:?\s*(.*))?/i);
    if (muteMatch) {
      return {
        intent: 'mod_timeout',
        targetId: muteMatch[1],
        duration: muteMatch[2] || '10m',
        reason: muteMatch[3] || 'Muted via AI command'
      };
    }

    // 5. Moderation Ban / Kick
    const banMatch = clean.match(/(?:ban)\s+<@!?(\d+)>\s*(?:reason:?\s*(.*))?/i);
    if (banMatch) {
      return {
        intent: 'mod_ban',
        targetId: banMatch[1],
        reason: banMatch[2] || 'Banned via AI command'
      };
    }

    const kickMatch = clean.match(/(?:kick)\s+<@!?(\d+)>\s*(?:reason:?\s*(.*))?/i);
    if (kickMatch) {
      return {
        intent: 'mod_kick',
        targetId: kickMatch[1],
        reason: kickMatch[2] || 'Kicked via AI command'
      };
    }

    // 6. Leveling & Rank
    if (clean.includes('my rank') || clean.includes('what level am i') || clean === 'rank') {
      return { intent: 'level_rank' };
    }
    if (clean.includes('leaderboard') || clean.includes('top members') || clean.includes('levels')) {
      return { intent: 'level_leaderboard' };
    }

    // 7. Economy Daily
    if (clean.includes('daily') || clean.includes('claim daily')) {
      return { intent: 'eco_daily' };
    }
    if (clean.includes('balance') || clean.includes('my coins') || clean.includes('wallet')) {
      return { intent: 'eco_balance' };
    }

    // 8. Remind
    const remindMatch = clean.match(/(?:remind me in|reminder in)\s+(\d+[smhd])\s+(?:to|that)?\s*(.+)/i);
    if (remindMatch) {
      return {
        intent: 'remind',
        time: remindMatch[1],
        text: remindMatch[2]
      };
    }

    // Default: General AI conversation / Search
    return { intent: 'chat', query: text };
  }

  /**
   * Generates AI conversation / live web search response for questions & conversation
   */
  static async chat(prompt, context = {}) {
    const clean = (prompt || '').trim();
    const cleanLower = clean.toLowerCase();

    // 1. Direct Creator / Persona questions
    if (
      cleanLower.includes('who made you') ||
      cleanLower.includes('who created you') ||
      cleanLower.includes('who is your creator') ||
      cleanLower.includes('who is your owner') ||
      cleanLower.includes('your owner') ||
      cleanLower.includes('rixie') ||
      cleanLower.includes('rixieplayz')
    ) {
      return (
        `👑 **My Creator is RixiePlayz!** ✨\n\n` +
        `He's an awesome developer who loves **Minecraft**, **Free Fire**, and gaming! 🎮\n` +
        `He built me with lots of code, chaos, and a little moon magic 🌙💙`
      );
    }

    if (
      cleanLower === 'hi' ||
      cleanLower === 'hello' ||
      cleanLower === 'hey' ||
      cleanLower === 'heyy' ||
      cleanLower === 'heyyy' ||
      cleanLower === 'start' ||
      cleanLower === 'help'
    ) {
      return MOONY_WELCOME;
    }

    if (
      cleanLower.includes('who are you') ||
      cleanLower.includes('what are you') ||
      cleanLower.includes('introduce yourself')
    ) {
      return (
        `🌙 **I'm Moony!** 💙 A cute all-in-one Discord bot created by **RixiePlayz** ✨\n\n` +
        `I can stream high-fidelity Spotify music, moderate servers, track XP levels with custom SVG rank cards, manage tickets, post live YouTube/Reddit feeds, and search up answers for you anytime! 🚀`
      );
    }

    // 2. Try Gemini API (if key provided)
    if (config.geminiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${config.geminiKey}`;
        const body = {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are Moony, a cheerful Discord bot created by RixiePlayz (who loves Minecraft, Free Fire & gaming). Help the user with: ${clean}. Keep response concise and in Discord Markdown.`
                }
              ]
            }
          ]
        };
        const res = await axios.post(url, body, { timeout: 8000 });
        const answer = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (answer) return answer;
      } catch (err) {
        Logger.error('Gemini AI error:', err.message);
      }
    }

    // 3. Try OpenAI API (if key provided)
    if (config.openaiKey) {
      try {
        const res = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are Moony, a cute Discord bot created by RixiePlayz (who loves Minecraft, Free Fire & gaming). Answer concisely in Discord Markdown.'
              },
              { role: 'user', content: clean }
            ]
          },
          {
            headers: { Authorization: `Bearer ${config.openaiKey}` },
            timeout: 8000
          }
        );
        const ans = res.data?.choices?.[0]?.message?.content;
        if (ans) return ans;
      } catch (err) {
        Logger.error('OpenAI error:', err.message);
      }
    }

    // Google/Web Search fallback has been removed per user request.
    // 5. Friendly Personality Fallback
    return (
      `🌙 **Moony here!** 💙\n\n` +
      `I heard your message! I'm here to help with music, moderation, leveling, tickets, and searching up information.\n\n` +
      `Ask me any question like:\n` +
      `• *"Who created you?"*\n` +
      `• *"What is Minecraft?"*\n` +
      `• *"How does gravity work?"*\n` +
      `• Or type \`/help\` in your server for the full menu! ✨`
    );
  }
}

module.exports = AIParser;
