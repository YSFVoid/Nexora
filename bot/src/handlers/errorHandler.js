const logger = require('../utils/logger');

function registerErrorHandlers(client) {
  process.on('unhandledRejection', (err) => {
    logger.error('Process', `Unhandled rejection: ${err?.message || err}`);
    if (err?.stack) logger.error('Process', err.stack);
  });

  process.on('uncaughtException', (err) => {
    logger.error('Process', `Uncaught exception: ${err.message}`);
    logger.error('Process', err.stack);
  });

  client.on('error', (err) => {
    logger.error('Client', `Discord client error: ${err.message}`);
  });

  client.on('warn', (msg) => {
    logger.warn('Client', msg);
  });

  client.on('shardError', (err) => {
    logger.error('Shard', `Shard error: ${err.message}`);
  });

  client.on('shardDisconnect', (event, shardId) => {
    logger.warn('Shard', `Shard ${shardId} disconnected`);
  });

  client.on('shardReconnecting', (shardId) => {
    logger.info('Shard', `Shard ${shardId} reconnecting...`);
  });
}

module.exports = { registerErrorHandlers };
