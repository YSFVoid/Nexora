const logger = require('../utils/logger');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    logger.info('Bot', `Logged in as ${client.user.tag}`);
    logger.info('Bot', `Serving ${client.guilds.cache.size} guilds`);

    client.user.setPresence({
      activities: [{ name: '/help | nexora.gg', type: 3 }],
      status: 'online',
    });

    try {
      const { startCleanupJob } = require('../modules/tempvoice/tempVoiceService');
      startCleanupJob(client);
    } catch { }
  },
};
