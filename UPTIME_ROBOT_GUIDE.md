# 🌐 How to Host Moony 24/7 for Free with UptimeRobot

This guide walks you through setting up **Moony** to run **24 hours a day, 7 days a week** without turning off, using **UptimeRobot** paired with popular cloud hosting providers like **Render**, **Replit**, **Koyeb**, or a **VPS**.

---

## ⚡ How It Works

Discord bots running on free hosting platforms (like Render or Replit) are designed to "go to sleep" after 15 minutes of inactivity to save server resources.

To keep Moony awake 24/7:
1. Moony includes an internal web server with a dedicated `/ping` health check endpoint.
2. **UptimeRobot** (a free 24/7 monitoring service) sends an HTTP ping to your bot every **5 minutes**.
3. Every time UptimeRobot pings the bot, your hosting provider resets its sleep timer, keeping Moony permanently active and connected to Discord!

```
┌─────────────────┐       HTTP GET /ping (Every 5 mins)       ┌────────────────────────┐
│   UptimeRobot   │ ────────────────────────────────────────> │   Moony Web Server     │
│   (Free Cloud)  │ <──────────────────────────────────────── │   (Port 3000 / Render) │
└─────────────────┘              HTTP 200 OK                  └───────────┬────────────┘
                                                                          │
                                                                   WebSocket Gateway
                                                                          │
                                                                          ▼
                                                              ┌────────────────────────┐
                                                              │   Discord API 24/7     │
                                                              └────────────────────────┘
```

---

## 🚀 Step 1: Deploy Moony to a Cloud Host

Choose whichever hosting provider you prefer:

### Option A: Render (Recommended — Free & Reliable)
1. Fork or push this repository to your GitHub account.
2. Go to [Render.com](https://render.com) and sign in with GitHub.
3. Click **New +** > **Web Service**.
4. Select your **Moony** repository.
5. Fill in the deployment settings:
   - **Name**: `moony-discord-bot`
   - **Region**: Choose the closest region (e.g., Oregon or Frankfurt)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
6. Click **Advanced** > **Add Environment Variable** and add your secrets:
   - `DISCORD_TOKEN` = *Your Bot Token from Discord Developer Portal*
   - `CLIENT_ID` = *Your Bot Application ID*
   - `PORT` = `3000`
   - *(Optional)* `GUILD_ID` = *Your Discord Server ID for instant command loading*
   - *(Optional)* `DEFAULT_PREFIX` = `!`
   - *(Optional)* `GEMINI_API_KEY` = *Your Google Gemini API key*
7. Click **Create Web Service**.
8. Once the build finishes, copy your unique public Render URL at the top left (e.g. `https://moony-discord-bot-xxxx.onrender.com`).

---

### Option B: Replit
1. Go to [Replit.com](https://replit.com) and click **Create Repl** > **Import from GitHub**.
2. Paste your repository link `https://github.com/xritx2-bit/Moony`.
3. Open the **Secrets (Tools > Secrets)** tab in Replit and add:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `PORT` = `3000`
4. Click the green **Run** button at the top.
5. Once running, Replit will open a **Webview** window displaying the Moony status page. Copy the URL from the Webview (e.g. `https://moony.yourusername.repl.co`).

---

### Option C: Koyeb (Docker / Free Tier)
1. Sign up at [Koyeb.com](https://www.koyeb.com).
2. Create an App > Select **GitHub**.
3. Choose the repository and select **Dockerfile** as build builder.
4. Set Port to `3000` with HTTP protocol.
5. Add your Environment Variables (`DISCORD_TOKEN`, `CLIENT_ID`, etc.).
6. Deploy and copy your Koyeb public URL (`https://xxxx.koyeb.app`).

---

### Option D: Linux VPS / Docker / PM2
If you have a Linux VPS (Oracle Cloud Free, DigitalOcean, Hetzner, etc.):
```bash
# Using PM2 (Auto-restart on reboot):
npm install -g pm2
npm install
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```
Or using Docker Compose:
```bash
docker compose up -d
```

---

## 🤖 Step 2: Configure UptimeRobot (Keep it Awake 24/7)

1. Create a free account at [UptimeRobot.com](https://uptimerobot.com).
2. From the dashboard, click the **+ Add New Monitor** button.
3. Configure the monitor as follows:
   - **Monitor Type**: Select `HTTP(s)`
   - **Friendly Name**: `Moony Discord Bot 24/7`
   - **URL (or IP)**: Paste your public host URL with `/ping`:
     ```
     https://your-bot-name.onrender.com/ping
     ```
     *(Example: `https://moony.onrender.com/ping`)*
   - **Monitoring Interval**: Set to **`Every 5 minutes`** (standard free tier interval)
   - **Monitor Timeout**: `30 seconds`
   - **Alert Contacts To Notify**: Check your email address so you get alerted if the bot ever goes down.
4. Click **Create Monitor**.

🎉 **That's it!** UptimeRobot will now ping your bot every 5 minutes, ensuring your bot never sleeps!

---

## 🔍 Verification & Health Endpoints

Moony provides multiple endpoints you can test in your browser or ping tool:

| Endpoint | Method | Output | Description |
| :--- | :--- | :--- | :--- |
| `/ping` | `GET` / `HEAD` | `{"status":"online", ...}` | Primary keep-alive endpoint for UptimeRobot |
| `/health` | `GET` | `{"status":"online", ...}` | Standard cloud health check endpoint |
| `/ping/text` | `GET` | `OK - Moony is 24/7 Online` | Plain text response for simple monitors |
| `/api/stats` | `GET` | Live telemetry JSON | Bot ping, memory, guild count, orders |
| `/` | `GET` | Web Dashboard / Status Card | Visual dashboard for browsers |

---

## 🛡️ Discord Developer Portal Checklist

Ensure your bot has the required permissions enabled or it will fail to start:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click your Moony application > navigate to the **Bot** tab.
3. Scroll down to **Privileged Gateway Intents** and enable ALL three:
   - [x] **Presence Intent**
   - [x] **Server Members Intent**
   - [x] **Message Content Intent**
4. Click **Save Changes**.
5. Under **Token**, click **Reset Token** and copy the new token into your `DISCORD_TOKEN` environment variable on your host.

---

## ❓ Frequently Asked Questions & Troubleshooting

### Why is my bot still going to sleep on Render?
- Make sure the URL in UptimeRobot ends in `/ping` (e.g. `https://your-service.onrender.com/ping`).
- Ensure the UptimeRobot interval is set to **5 minutes** or less (Render sleeps after 15 minutes of inactivity).
- Check the **Logs** tab on Render to verify that HTTP requests from UptimeRobot are arriving.

### Can I run a backup self-pinger?
Yes! In your environment variables, add:
```ini
KEEP_ALIVE_URL=https://your-service.onrender.com
SELF_PING_INTERVAL=4
```
Moony will automatically ping itself every 4 minutes as a secondary backup.

### Error: `Disallowed Intents`
You forgot to check the **Privileged Gateway Intents** in the Discord Developer Portal (see checklist above).

### How do I register slash commands?
Moony automatically registers commands on startup. You can also manually trigger deployment by running:
```bash
npm run deploy-commands
```
If you provide `GUILD_ID` in your `.env`, commands appear instantly in that test server. Global commands may take a few minutes to sync across Discord's CDN.
