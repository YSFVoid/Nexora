const { loadCommands, deploySlashCommands } = require('./handlers/commandHandler');
const { Client, GatewayIntentBits } = require('discord.js');
require('./config/env');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
loadCommands(client);
deploySlashCommands(client).then(() => {
  console.log('Commands deployed. Exiting.');
  process.exit(0);
}).catch((err) => {
  console.error('Deploy failed:', err);
  process.exit(1);
});
