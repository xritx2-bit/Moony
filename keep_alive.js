/**
 * 🌙 Moony — 24/7 Keep-Alive Server for UptimeRobot
 * 
 * This module ensures Moony remains online 24/7 when hosted on platforms
 * like Render, Replit, Koyeb, Glitch, Railway, or VPS by serving an HTTP
 * endpoint that can be monitored by UptimeRobot or other uptime checkers.
 *
 * Designed with zero-dependency fallback (works with Express or built-in Node http).
 *
 * Usage:
 * - Can be run standalone: `node keep_alive.js`
 * - Can be required in index.js: `require('./keep_alive')()`
 */

const http = require('http');
const https = require('https');

let activeServer = null;

function keepAlive(customPort = null) {
  if (activeServer) {
    return activeServer;
  }

  const PORT = customPort || process.env.PORT || 3000;

  // Try using express if available, otherwise fallback to native http
  let expressApp = null;
  try {
    const express = require('express');
    expressApp = express();
    expressApp.use(express.json());
  } catch (e) {
    // Express not installed yet, will use native http server
    expressApp = null;
  }

  const getHtml = () => {
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const seconds = Math.floor(uptimeSec % 60);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Moony Bot — 24/7 Online</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      background: radial-gradient(circle at 50% 20%, #1e1f38 0%, #0c0d16 100%);
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(88, 101, 242, 0.15);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(87, 242, 135, 0.15);
      color: #57f287;
      padding: 6px 14px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 20px;
      border: 1px solid rgba(87, 242, 135, 0.3);
    }
    .pulse {
      width: 8px;
      height: 8px;
      background: #57f287;
      border-radius: 50%;
      box-shadow: 0 0 12px #57f287;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }
    h1 { font-size: 1.9rem; font-weight: 700; margin-bottom: 8px; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin-bottom: 24px; }
    .url-box {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px 16px;
      font-family: monospace;
      font-size: 0.9rem;
      color: #38bdf8;
      word-break: break-all;
      margin-bottom: 24px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      text-align: left;
      margin-bottom: 24px;
    }
    .info-item {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 12px;
      border-radius: 12px;
    }
    .info-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-val { font-size: 1rem; font-weight: 600; color: #e2e8f0; margin-top: 4px; }
    .footer-note { font-size: 0.8rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="pulse"></span> Online 24/7
    </div>
    <h1>🌙 Moony Discord Bot</h1>
    <p>The keep-alive web server is active. Point your <strong>UptimeRobot HTTP Monitor</strong> to the endpoint below to keep your bot awake 24/7!</p>
    <div class="url-box">/ping</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Status</div>
        <div class="info-val" style="color: #57f287;">200 OK</div>
      </div>
      <div class="info-item">
        <div class="info-label">Uptime</div>
        <div class="info-val">${hours}h ${minutes}m ${seconds}s</div>
      </div>
    </div>
    <div class="footer-note">Crafted with 💙 by RixiePlayz • Ready for UptimeRobot</div>
  </div>
</body>
</html>`;
  };

  const getPingJson = () => {
    const uptimeSec = Math.floor(process.uptime());
    const days = Math.floor(uptimeSec / 86400);
    const hours = Math.floor((uptimeSec % 86400) / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);

    return JSON.stringify({
      status: 'online',
      service: 'Moony 24/7 Keep-Alive',
      uptime: `${days}d ${hours}h ${minutes}m`,
      uptimeSeconds: uptimeSec,
      timestamp: new Date().toISOString()
    });
  };

  if (expressApp) {
    // Using Express
    expressApp.head('/', (req, res) => res.status(200).end());

    expressApp.all(['/ping', '/health', '/healthz', '/status', '/uptime', '/keepalive'], (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(getPingJson());
    });

    expressApp.all('/ping/text', (req, res) => {
      res.status(200).send('OK - Moony is 24/7 Online');
    });

    expressApp.get('/', (req, res) => {
      res.status(200).send(getHtml());
    });

    try {
      activeServer = expressApp.listen(PORT, '0.0.0.0', () => {
        console.log(`[Keep-Alive] 🚀 Server listening on port ${PORT}`);
        console.log(`[Keep-Alive] ⚡ UptimeRobot Ping URL: http://localhost:${PORT}/ping`);
      });
    } catch (e) {
      console.error(`[Keep-Alive] Express listen error:`, e.message);
    }
  } else {
    // Fallback using native Node HTTP server
    const server = http.createServer((req, res) => {
      const url = req.url.split('?')[0];

      if (req.method === 'HEAD' && url === '/') {
        res.writeHead(200);
        return res.end();
      }

      if (['/ping', '/health', '/healthz', '/status', '/uptime', '/keepalive'].includes(url)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(getPingJson());
      }

      if (url === '/ping/text') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end('OK - Moony is 24/7 Online');
      }

      // Default landing page
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(getHtml());
    });

    try {
      activeServer = server.listen(PORT, '0.0.0.0', () => {
        console.log(`[Keep-Alive] 🚀 Server listening on port ${PORT}`);
        console.log(`[Keep-Alive] ⚡ UptimeRobot Ping URL: http://localhost:${PORT}/ping`);
      });
    } catch (e) {
      console.error(`[Keep-Alive] Native HTTP listen error:`, e.message);
    }
  }

  if (activeServer) {
    activeServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Keep-Alive] Port ${PORT} already active (main dashboard running). Keep-Alive active!`);
      } else {
        console.error(`[Keep-Alive] Server error:`, err.message);
      }
    });
  }

  // Activate optional self-pinger
  initSelfPinger();

  return activeServer;
}

/**
 * Optional self-pinger utility as a backup to UptimeRobot.
 * Activated if KEEP_ALIVE_URL, APP_URL, or RENDER_EXTERNAL_URL is set in environment.
 */
function initSelfPinger() {
  const targetUrl = process.env.KEEP_ALIVE_URL || 
                    process.env.APP_URL || 
                    process.env.PROJECT_URL || 
                    process.env.RENDER_EXTERNAL_URL;

  if (!targetUrl) return;

  const pingUrl = targetUrl.endsWith('/ping') ? targetUrl : `${targetUrl.replace(/\/$/, '')}/ping`;
  const intervalMinutes = parseInt(process.env.SELF_PING_INTERVAL, 10) || 4;

  console.log(`[Keep-Alive] 🔁 Self-pinger activated for: ${pingUrl} (every ${intervalMinutes} min)`);

  setInterval(() => {
    try {
      const client = pingUrl.startsWith('https') ? https : http;
      client.get(pingUrl, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Success (silent to avoid log spam)
        } else {
          console.warn(`[Keep-Alive] ⚠️ Self-ping responded with status: ${res.statusCode}`);
        }
      }).on('error', (err) => {
        console.warn(`[Keep-Alive] ⚠️ Self-ping error:`, err.message);
      });
    } catch (e) {
      // Ignored
    }
  }, intervalMinutes * 60 * 1000);
}

// Auto-run if executed directly (`node keep_alive.js`)
if (require.main === module) {
  keepAlive();
}

module.exports = keepAlive;
module.exports.keepAlive = keepAlive;
