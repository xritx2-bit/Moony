const axios = require('axios');
const config = require('../config');
const Logger = require('./logger');
const WebSearch = require('./webSearch');

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

    // 1. Moderation Purge
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
        `I can help moderate servers, track XP levels with custom SVG rank cards, manage automated store tickets, post live YouTube/Reddit feeds, and search up answers for you anytime! 🚀`
      );
    }

    // 2. Try Gemini API (Primary AI Engine when key is provided)
    if (config.geminiKey) {
      const gemini = await this.callGemini(clean);
      if (gemini && gemini.success) {
        return gemini.text;
      }

      // If user supplied a Gemini key, report the exact Google error instead of silently falling back to Wikipedia
      Logger.error(`Gemini API Error for key [${config.geminiKey.slice(0, 6)}...]:`, gemini?.error);
      return (
        `⚠️ **Google Gemini AI Error:**\n> \`${gemini?.error || 'Unable to connect to Google Gemini API'}\`\n\n` +
        `💡 *Please verify your \`GEMINI_API_KEY\` in your environment settings or at [Google AI Studio](https://aistudio.google.com/).*`
      );
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
            timeout: 10000
          }
        );
        const ans = res.data?.choices?.[0]?.message?.content;
        if (ans) return ans;
      } catch (err) {
        Logger.error('OpenAI error:', err.response?.data?.error?.message || err.message);
        return `⚠️ **OpenAI Error:**\n> \`${err.response?.data?.error?.message || err.message}\``;
      }
    }

    // 4. Free Fallback: Live Internet Knowledge & Web Search (ONLY when no AI API keys are configured)
    try {
      const searchTopic = clean
        .replace(/^(?:moony|bot|hey moony|tell me|what is|who is|how to|where is|explain|search for|google)\s+/i, '')
        .trim();

      const searchResult = await WebSearch.search(searchTopic || clean);

      if (searchResult && searchResult.summary) {
        let reply = `🌙 **Here is what I found for you!** 💙\n\n`;
        reply += `📌 **${searchResult.title}**\n`;
        reply += `${searchResult.summary}\n\n`;
        if (searchResult.url) {
          reply += `🔗 *Source:* <${searchResult.url}>\n`;
        }
        reply += `— *Searched with Moony Moon Magic 🌙*`;
        return reply;
      }
    } catch (searchErr) {
      Logger.error('Search error in AI parser:', searchErr.message);
    }

    // 5. Friendly Personality Fallback
    return (
      `🌙 **Moony here!** 💙\n\n` +
      `I heard your message! I'm here to help with moderation, leveling, store tickets, and searching up information.\n\n` +
      `Ask me any question like:\n` +
      `• *"Who created you?"*\n` +
      `• *"What is Minecraft?"*\n` +
      `• *"How does gravity work?"*\n` +
      `• Or type \`/help\` in your server for the full menu! ✨`
    );
  }

  static cachedModels = null;
  static lastModelsFetch = 0;

  /**
   * Queries Google Gemini ModelService to dynamically discover supported models for the API key
   */
  static async getAvailableModels(apiKey) {
    if (this.cachedModels && (Date.now() - this.lastModelsFetch < 3600000)) {
      return this.cachedModels;
    }

    const defaultModels = [
      'gemini-flash-lite-latest',
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.5-flash'
    ];

    try {
      const res = await axios.get('https://generativelanguage.googleapis.com/v1beta/models', {
        params: { key: apiKey },
        headers: { 'x-goog-api-key': apiKey },
        timeout: 8000
      });

      if (res.data && Array.isArray(res.data.models)) {
        const valid = res.data.models
          .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
          .map(m => m.name.replace(/^models\//, ''))
          .filter(m => !m.includes('gemini-pro') && !m.includes('gemini-1.0') && !m.includes('vision') && !m.includes('2.5-pro'));

        if (valid.length > 0) {
          const priority = [
            'gemini-flash-lite-latest',
            'gemini-3.6-flash',
            'gemini-3.5-flash-lite',
            'gemini-flash-latest',
            'gemini-3.8-flash',
            'gemini-3.7-flash',
            'gemini-3.5-flash',
            'gemini-2.5-flash-lite',
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash'
          ];
          valid.sort((a, b) => {
            const idxA = priority.findIndex(p => a === p || a.startsWith(p));
            const idxB = priority.findIndex(p => b === p || b.startsWith(p));
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
          });

          this.cachedModels = valid;
          this.lastModelsFetch = Date.now();
          Logger.info(`Auto-discovered ${valid.length} active Gemini models (Default: ${valid[0]})`);
          return valid;
        }
      }
    } catch (err) {
      if (err.response?.data?.error?.message) {
        throw new Error(err.response.data.error.message);
      }
    }

    return defaultModels;
  }

  /**
   * Directly queries Google Gemini API with dynamically resolved models and relaxed safety thresholds
   */
  static async callGemini(prompt) {
    const apiKey = config.geminiKey;
    if (!apiKey) return null;

    let models;
    try {
      models = await this.getAvailableModels(apiKey);
    } catch (discoveryErr) {
      return { success: false, error: discoveryErr.message };
    }

    let lastError = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload = {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are Moony, a cheerful, intelligent, and helpful Discord superbot created by RixiePlayz (who loves Minecraft, Free Fire & gaming). Help the user with: "${prompt}". Provide a natural, smart, and friendly response formatted in clean Discord Markdown. Do not answer like an encyclopedia or search engine summary.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
          ]
        };

        const res = await axios.post(url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          timeout: 15000
        });

        const candidate = res.data?.candidates?.[0];
        const textParts = candidate?.content?.parts?.map(p => p.text).filter(Boolean).join('\n');

        if (textParts && textParts.trim().length > 0) {
          return { success: true, text: textParts.trim(), model };
        }

        if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
          return {
            success: false,
            error: `Response blocked by Google safety filters (${candidate.finishReason})`
          };
        }
      } catch (err) {
        const errMessage = err.response?.data?.error?.message || err.message;
        lastError = errMessage;
        Logger.warn(`Gemini (${model}) error: ${errMessage}`);

        // If the API key is completely invalid, no need to retry with different models
        if (
          errMessage.includes('API key not valid') ||
          errMessage.includes('API_KEY_INVALID') ||
          errMessage.includes('PERMISSION_DENIED')
        ) {
          break;
        }
      }
    }

    return { success: false, error: lastError || 'Unknown Gemini error' };
  }
}

module.exports = AIParser;
