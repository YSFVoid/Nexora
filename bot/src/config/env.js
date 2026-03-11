require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const env = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexora',
  BOT_PREFIX: process.env.BOT_PREFIX || '!',
  BOT_DEFAULT_LANGUAGE: process.env.BOT_DEFAULT_LANGUAGE || 'en',
  DASHBOARD_URL: process.env.DASHBOARD_URL || 'http://localhost:3000',
  API_PORT: parseInt(process.env.API_PORT) || 3001,
};

const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
for (const key of required) {
  if (!env[key]) {
    console.error(`[ENV] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

module.exports = env;
