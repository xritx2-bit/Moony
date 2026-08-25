const axios = require('axios');
const Logger = require('./logger');

class WebSearch {
  /**
   * Searches web sources (Wikipedia Search & Summary, DuckDuckGo Knowledge, Calculations) without API keys
   */
  static async search(query) {
    const cleanQuery = query.trim();

    // 1. Math / Calculations
    const mathMatch = cleanQuery.match(/^(?:what is|calculate|solve)?\s*([\d\s\+\-\*\/\^\(\)\.\%]+)$/i);
    if (mathMatch && mathMatch[1].trim().length >= 3 && /[\+\-\*\/]/.test(mathMatch[1])) {
      try {
        const sanitized = mathMatch[1].replace(/[^0-9\+\-\*\/\(\)\.\s]/g, '');
        const result = Function(`'use strict'; return (${sanitized})`)();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          return {
            title: `Calculation Result`,
            summary: `**${sanitized.trim()}** = \`${result}\``,
            source: 'Calculator'
          };
        }
      } catch (e) {}
    }

    // 2. Direct Wikipedia Page Summary
    try {
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery)}`;
      const wikiRes = await axios.get(wikiUrl, {
        headers: { 'User-Agent': 'MoonyDiscordBot/1.0 (https://discord.com)' },
        timeout: 4000
      });
      if (wikiRes.data && wikiRes.data.extract && wikiRes.data.extract.length > 40 && wikiRes.data.type !== 'disambiguation') {
        return {
          title: wikiRes.data.title || cleanQuery,
          summary: wikiRes.data.extract,
          url: wikiRes.data.content_urls?.desktop?.page || null,
          thumbnail: wikiRes.data.thumbnail?.source || null,
          source: 'Wikipedia'
        };
      }
    } catch (e) {}

    // 3. Wikipedia Search Query (finds closest matching article title and extracts summary)
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&format=json&utf8=1`;
      const searchRes = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'MoonyDiscordBot/1.0 (https://discord.com)' },
        timeout: 4000
      });

      const searchHits = searchRes.data?.query?.search;
      if (searchHits && searchHits.length > 0) {
        const topHit = searchHits[0];
        // Fetch full extract for top hit title
        try {
          const detailUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topHit.title)}`;
          const detailRes = await axios.get(detailUrl, {
            headers: { 'User-Agent': 'MoonyDiscordBot/1.0' },
            timeout: 4000
          });
          if (detailRes.data && detailRes.data.extract && detailRes.data.extract.length > 30) {
            return {
              title: detailRes.data.title,
              summary: detailRes.data.extract,
              url: detailRes.data.content_urls?.desktop?.page || null,
              thumbnail: detailRes.data.thumbnail?.source || null,
              source: 'Wikipedia'
            };
          }
        } catch (detailErr) {}

        const snippetClean = topHit.snippet.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
        return {
          title: topHit.title,
          summary: snippetClean,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topHit.title.replace(/ /g, '_'))}`,
          source: 'Wikipedia'
        };
      }
    } catch (e) {}

    // 4. DuckDuckGo Instant Answer
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1&skip_disambig=1`;
      const ddgRes = await axios.get(ddgUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 4000
      });
      if (ddgRes.data && ddgRes.data.AbstractText && ddgRes.data.AbstractText.length > 20) {
        return {
          title: ddgRes.data.Heading || cleanQuery,
          summary: ddgRes.data.AbstractText,
          url: ddgRes.data.AbstractURL || null,
          source: ddgRes.data.AbstractSource || 'DuckDuckGo Knowledge'
        };
      }
    } catch (e) {}

    return null;
  }
}

module.exports = WebSearch;
