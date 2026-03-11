const GuildConfig = require('../models/GuildConfig');
const logger = require('../utils/logger');

const cache = new Map();
const CACHE_TTL = 300000;

async function getGuildConfig(guildId) {
  const cached = cache.get(guildId);
  if (cached && Date.now() - cached._cachedAt < CACHE_TTL) {
    return cached;
  }

  try {
    let config = await GuildConfig.findOne({ guildId });
    if (!config) {
      config = await GuildConfig.create({ guildId });
      logger.info('Config', `Created default config for guild ${guildId}`);
    }

    const obj = config.toObject();
    obj._cachedAt = Date.now();
    cache.set(guildId, obj);
    return obj;
  } catch (err) {
    logger.error('Config', `Failed to get config for guild ${guildId}: ${err.message}`);
    return { guildId, prefix: '!', language: 'en', modules: {}, setupCompleted: false };
  }
}

async function updateGuildConfig(guildId, updates) {
  try {
    const config = await GuildConfig.findOneAndUpdate(
      { guildId },
      { $set: updates },
      { new: true, upsert: true }
    );
    const obj = config.toObject();
    obj._cachedAt = Date.now();
    cache.set(guildId, obj);
    return obj;
  } catch (err) {
    logger.error('Config', `Failed to update config for guild ${guildId}: ${err.message}`);
    throw err;
  }
}

function invalidateCache(guildId) {
  cache.delete(guildId);
}

module.exports = { getGuildConfig, updateGuildConfig, invalidateCache };
