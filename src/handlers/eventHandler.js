const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');

class EventHandler {
  static load(client) {
    const eventsPath = path.join(__dirname, '../events');
    const folders = fs.readdirSync(eventsPath);

    let totalEvents = 0;

    for (const folder of folders) {
      const folderPath = path.join(eventsPath, folder);
      if (!fs.statSync(folderPath).isDirectory()) continue;

      const eventFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

      for (const file of eventFiles) {
        const filePath = path.join(folderPath, file);
        try {
          const event = require(filePath);
          if (event.name && event.execute) {
            if (event.once) {
              client.once(event.name, (...args) => event.execute(...args, client));
            } else {
              client.on(event.name, (...args) => event.execute(...args, client));
            }
            totalEvents++;
          }
        } catch (err) {
          Logger.error(`Failed to load event ${file}:`, err.message);
        }
      }
    }

    Logger.success(`Registered ${totalEvents} event listeners.`);
  }
}

module.exports = EventHandler;
