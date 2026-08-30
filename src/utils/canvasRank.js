const { AttachmentBuilder } = require('discord.js');

class CanvasRank {
  /**
   * Generates a sleek, high-definition SVG Rank Card for the user
   */
  static generateRankSvg(user, rank, level, currentXp, neededXp, avatarUrl) {
    const width = 900;
    const height = 280;
    const progress = Math.min(Math.max(currentXp / neededXp, 0), 1);
    const progressWidth = Math.round(550 * progress);

    const safeUsername = (user.username || 'User').replace(/[<>&'"]/g, '');
    const safeTag = (user.discriminator && user.discriminator !== '0') ? `#${user.discriminator}` : '';
    const avatar = avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png';

    const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Background Gradient -->
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f0c29" />
          <stop offset="50%" stop-color="#302b63" />
          <stop offset="100%" stop-color="#24243e" />
        </linearGradient>

        <!-- Glass Overlay Gradient -->
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.03" />
        </linearGradient>

        <!-- Progress Bar Gradient -->
        <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#5865F2" />
          <stop offset="50%" stop-color="#9B59B6" />
          <stop offset="100%" stop-color="#1DB954" />
        </linearGradient>

        <!-- Avatar Circle Clip -->
        <clipPath id="avatarClip">
          <circle cx="130" cy="140" r="75" />
        </clipPath>

        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="12" stdDeviation="15" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>

      <!-- Main Container Card -->
      <rect x="15" y="15" width="870" height="250" rx="30" fill="url(#bgGrad)" filter="url(#shadow)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
      <rect x="15" y="15" width="870" height="250" rx="30" fill="url(#glassGrad)"/>

      <!-- Glowing Accent Circles -->
      <circle cx="800" cy="50" r="120" fill="#5865F2" opacity="0.15" filter="blur(40px)"/>
      <circle cx="200" cy="230" r="100" fill="#1DB954" opacity="0.15" filter="blur(40px)"/>

      <!-- Avatar Outer Ring & Image -->
      <circle cx="130" cy="140" r="82" fill="none" stroke="url(#barGrad)" stroke-width="4" />
      <image href="${avatar}" x="55" y="65" width="150" height="150" clip-path="url(#avatarClip)" />
      <!-- Online Status Badge -->
      <circle cx="190" cy="195" r="16" fill="#1e1f22" />
      <circle cx="190" cy="195" r="12" fill="#57F287" />

      <!-- Username & Tag -->
      <text x="255" y="115" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="34" font-weight="bold" fill="#FFFFFF">
        ${safeUsername}
        <tspan font-size="20" fill="#AAAAAA" font-weight="normal">${safeTag}</tspan>
      </text>

      <!-- Rank & Level Stats (Top Right) -->
      <text x="650" y="115" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="22" font-weight="bold" fill="#888888">
        RANK <tspan font-size="32" fill="#5865F2">#${rank}</tspan>
      </text>
      <text x="770" y="115" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="22" font-weight="bold" fill="#888888">
        LEVEL <tspan font-size="32" fill="#1DB954">${level}</tspan>
      </text>

      <!-- XP Text (Above Progress Bar) -->
      <text x="800" y="165" text-anchor="end" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="18" font-weight="bold" fill="#CCCCCC">
        ${currentXp.toLocaleString()} <tspan fill="#777777">/ ${neededXp.toLocaleString()} XP</tspan>
      </text>

      <!-- Progress Bar Track -->
      <rect x="255" y="180" width="550" height="26" rx="13" fill="#18191c" />
      <!-- Progress Bar Fill -->
      <rect x="255" y="180" width="${Math.max(26, progressWidth)}" height="26" rx="13" fill="url(#barGrad)" />

      <!-- Subtitle Badge -->
      <text x="255" y="235" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="14" font-weight="600" fill="#9B59B6" letter-spacing="2">
        ✦ MOONY GAMIFICATION ✦
      </text>
    </svg>`;

    return Buffer.from(svg.trim());
  }

  /**
   * Generates a Welcome Banner SVG
   */
  static generateWelcomeSvg(member, memberCount) {
    const width = 900;
    const height = 300;
    const safeUsername = (member.user.username || 'New Member').replace(/[<>&'"]/g, '');
    const serverName = (member.guild.name || 'Our Community').replace(/[<>&'"]/g, '');
    const avatar = member.user.displayAvatarURL({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

    const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#141E30" />
          <stop offset="100%" stop-color="#243B55" />
        </linearGradient>

        <clipPath id="wAvatarClip">
          <circle cx="450" cy="110" r="65" />
        </clipPath>
      </defs>

      <rect width="${width}" height="${height}" rx="25" fill="url(#wBgGrad)"/>
      <circle cx="100" cy="50" r="140" fill="#5865F2" opacity="0.2" filter="blur(50px)"/>
      <circle cx="800" cy="250" r="140" fill="#1DB954" opacity="0.2" filter="blur(50px)"/>

      <!-- Avatar Outer Ring -->
      <circle cx="450" cy="110" r="72" fill="none" stroke="#5865F2" stroke-width="4"/>
      <image href="${avatar}" x="385" y="45" width="130" height="130" clip-path="url(#wAvatarClip)"/>

      <!-- Welcome Title -->
      <text x="450" y="215" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="bold" fill="#FFFFFF">
        WELCOME TO ${serverName.toUpperCase()}
      </text>

      <!-- User name & Count -->
      <text x="450" y="250" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600" fill="#57F287">
        ${safeUsername} • Member #${memberCount}
      </text>
    </svg>`;

    return Buffer.from(svg.trim());
  }

  static createRankCardAttachment(user, rank, level, currentXp, neededXp, avatarUrl) {
    const buffer = this.generateRankSvg(user, rank, level, currentXp, neededXp, avatarUrl);
    return new AttachmentBuilder(buffer, { name: 'rank-card.svg' });
  }

  static createWelcomeAttachment(member, count) {
    const buffer = this.generateWelcomeSvg(member, count);
    return new AttachmentBuilder(buffer, { name: 'welcome-card.svg' });
  }
}

module.exports = CanvasRank;
