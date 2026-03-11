const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function loadEvents(client) {
  const eventsDir = path.join(__dirname, '..', 'events');
  if (!fs.existsSync(eventsDir)) {
    logger.warn('Events', 'No events directory found');
    return;
  }

  let count = 0;
  const entries = fs.readdirSync(eventsDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(eventsDir, entry.name);

    if (entry.isDirectory()) {
      const subEntries = fs.readdirSync(fullPath).filter((f) => f.endsWith('.js'));
      for (const file of subEntries) {
        loadEventFile(client, path.join(fullPath, file));
        count++;
      }
    } else if (entry.name.endsWith('.js')) {
      loadEventFile(client, fullPath);
      count++;
    }
  }

  logger.info('Events', `Loaded ${count} event listeners`);
}

function loadEventFile(client, filePath) {
  try {
    const event = require(filePath);
    if (!event.name) return;

    if (event.once) {
      client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
      client.on(event.name, (...args) => event.execute(client, ...args));
    }
  } catch (err) {
    logger.error('Events', `Failed to load event ${filePath}: ${err.message}`);
  }
}

module.exports = { loadEvents };
