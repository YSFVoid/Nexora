const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { connectDatabase } = require('./config/database');
const env = require('./config/env');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { registerErrorHandlers } = require('./handlers/errorHandler');
const { loadLocales } = require('./modules/localization/i18n');
const logger = require('./utils/logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
    Partials.Reaction,
  ],
  failIfNotExists: false,
});

async function start() {
  logger.info('Bot', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('Bot', '  Nexora — Starting up...');
  logger.info('Bot', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  registerErrorHandlers(client);
  await connectDatabase();
  loadLocales();
  loadCommands(client);
  loadEvents(client);

  await client.login(env.DISCORD_TOKEN);
}

start().catch((err) => {
  logger.error('Bot', `Fatal startup error: ${err.message}`);
  logger.error('Bot', err.stack);
  process.exit(1);
});

module.exports = client;
