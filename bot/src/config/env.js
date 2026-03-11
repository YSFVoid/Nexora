require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const env = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexora',
  BOT_PREFIX: process.env.BOT_PREFIX || '!',
  BOT_DEFAULT_LANGUAGE: process.env.BOT_DEFAULT_LANGUAGE || 'en',
};

const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
for (const key of required) {
  if (!env[key]) {
    console.error(`[ENV] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

module.exports = env;
