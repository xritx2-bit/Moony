# 🌙 Moony — The Ultimate Discord SuperBot

<p align="center">
  <img src="https://cdn-icons-png.flaticon.com/512/174/174872.png" width="120" alt="Moony Logo" />
</p>

<p align="center">
  <strong>Spotify-Grade Music • Auto-Moderation • Dynamic SVG Leveling • Tickets • Background Feeds • AI Web Knowledge • Glassmorphism Dashboard</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/discord.js-v14.18.0-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="discord.js" />
  <img src="https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/Created_By-RixiePlayz-1DB954?style=for-the-badge&logo=spotify&logoColor=white" alt="Creator" />
</p>

---

## ✨ About Moony

**Moony** is a Discord bot built with **discord.js v14**, **@discordjs/voice**, and **Express**. Designed by **RixiePlayz**, Moony unites music streaming, server moderation, gamification, support ticketing, automated news feeds, and live web knowledge AI into a package with a built-in web dashboard.

---

## 🌟 Key Features

### 🎵 1. Spotify-Grade Music & 24/7 Web Radio
- **Spotify Integration**: Direct support for Spotify track, album, and playlist URLs.
- **Interactive Visual Controller**: Real-time Now Playing embed with volume slider, shuffle, loop mode, track history, and playlist buttons.
- **24/7 Live Web Radio**: Stream high-quality non-stop stations: *Lo-Fi Chill Beats, Synthwave / Cyberpunk, Ambient, Gaming EDM, Pop Hits, and Anime / J-Pop*.
- **Custom Playlists**: Save and load your own personal playlists with `/playlist save` and `/playlist play`.

### 🛡️ 2. Comprehensive Moderation & Security
- **AutoMod System**: Anti-spam, anti-invite links, prohibited words filter, and mass mention limits.
- **Moderation Suite**: `/ban`, `/kick`, `/timeout` (flexible duration like `10m`, `1d`), `/untimeout`, `/warn`, `/warnings`, `/clearwarns`, `/purge` (with filters for bots, links, attachments), `/lock`, `/unlock`, and `/slowmode`.
- **Audit Logging**: Automated moderation event logs sent to your designated channel.

### ✨ 3. Leveling & Gamification
- **High-Definition SVG Rank Cards**: Vector rank cards with custom avatars, rank position, level progress bars, and stats.
- **Leaderboards & Role Rewards**: Server XP rankings and automatic role rewards granted on level milestones.

### 🎫 4. Support Desk & Ticketing System
- **Interactive Ticket Panels**: One-click ticket creation across multiple categories (*General Support, Billing, Bug Report, Moderation*).
- **Staff Actions**: Claim tickets, close tickets, and export full transcript logs.

### 💰 5. Virtual Economy & Casino
- **Economy System**: `/balance`, `/daily` (250 coin reward), `/work` (random shifts with 10m cooldown), `/pay` transfers.
- **Casino Mini-games**: Coinflip and 3-reel slot machine gambling.

### 📡 6. Automated Background Feeds
- **Real-Time Polling**: 2-minute automated background poster for **YouTube channels**, **Reddit subreddits**, and **RSS blog feeds**.

### 🤖 7. AI Assistant & Real-Time Web Search
- **Live Internet Knowledge**: Answers questions in real-time by searching Wikipedia and web knowledge endpoints—**no paid API keys required**!
- **Multi-Provider AI**: Optional support for **Google Gemini 1.5** and **OpenAI GPT-4o-mini**.
- **Personal DM Greetings**: Welcomes members who message Moony directly.

### 🌐 8. Built-in Glassmorphism Web Dashboard
- **Live Telemetry & Diagnostics**: Real-time server count, voice streams, latency, and memory monitoring.
- **Live Audio Visualizer**: Real-time progress bar monitor of songs currently streaming across all voice channels.
- **Searchable Command Browser**: Interactive command index with category filters.

---

## 📋 Slash Commands (50 Total)

| Category | Commands | Description |
| :--- | :--- | :--- |
| **🎵 Music** | `/play`, `/pause`, `/resume`, `/skip`, `/previous`, `/queue`, `/nowplaying`, `/loop`, `/shuffle`, `/volume`, `/stop`, `/radio`, `/playlist` | Lossless music player & 24/7 web radio |
| **🛡️ Moderation** | `/ban`, `/kick`, `/timeout`, `/untimeout`, `/warn`, `/warnings`, `/clearwarns`, `/purge`, `/lock`, `/unlock`, `/slowmode`, `/automod` | Complete server safety suite |
| **✨ Leveling** | `/rank`, `/leaderboard`, `/setxp`, `/rolereward` | SVG rank cards & milestone roles |
| **🎫 Tickets** | `/ticket-panel` | Interactive ticket system |
| **💰 Economy** | `/balance`, `/daily`, `/pay`, `/work`, `/gamble` | Virtual coins & casino games |
| **📡 Feeds** | `/feed` | YouTube, Reddit & RSS auto-posters |
| **🤖 AI** | `/ask`, `/summarize` | AI conversation & chat summaries |
| **🛠️ Utility** | `/help`, `/ping`, `/botinfo`, `/serverinfo`, `/userinfo`, `/avatar`, `/remind`, `/reactionrole` | General tools & self roles |
| **⚙️ Admin** | `/setup`, `/setwelcome`, `/setgoodbye`, `/setmodlog` | Server configuration |

---

## 🚀 Quick Setup Guide

### 1. Clone or Download Repository
```bash
git clone https://github.com/your-username/moony-discord-bot.git
cd moony-discord-bot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Open `.env` and enter your bot credentials from the [Discord Developer Portal](https://discord.com/developers/applications):
```ini
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_optional_test_guild_id

# Optional:
PORT=3000
DEFAULT_PREFIX=!
GEMINI_API_KEY=
OPENAI_API_KEY=
```

### 4. Deploy Slash Commands
```bash
node src/deploy-commands.js
```

### 5. Start Moony
```bash
# Production mode
node src/index.js

# Or development mode with auto-reload:
node --watch src/index.js
```

### 6. Open Web Dashboard
Visit [http://localhost:3000](http://localhost:3000) in your web browser!

---

## 👑 Credits & Author

Created with 💙 by **RixiePlayz** ✨
- 🎮 Loves: Minecraft, Free Fire & Gaming
- 💫 Built with code, chaos, and a little moon magic 🌙

---

## 📄 License
This project is licensed under the MIT License.
