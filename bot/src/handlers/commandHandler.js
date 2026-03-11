const fs = require('fs');
const path = require('path');
const { Collection, REST, Routes } = require('discord.js');
const logger = require('../utils/logger');
const env = require('../config/env');

function loadCommands(client) {
  client.slashCommands = new Collection();
  client.prefixCommands = new Collection();
  client.cooldowns = new Collection();

  const slashDir = path.join(__dirname, '..', 'commands', 'slash');
  if (fs.existsSync(slashDir)) {
    loadCommandsFromDir(slashDir, client.slashCommands, 'slash');
  }

  const prefixDir = path.join(__dirname, '..', 'commands', 'prefix');
  if (fs.existsSync(prefixDir)) {
    loadCommandsFromDir(prefixDir, client.prefixCommands, 'prefix');
  }

  logger.info('Commands', `Loaded ${client.slashCommands.size} slash, ${client.prefixCommands.size} prefix commands`);
}

function loadCommandsFromDir(dir, collection, type) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommandsFromDir(fullPath, collection, type);
    } else if (entry.name.endsWith('.js')) {
      try {
        const command = require(fullPath);
        if (command.name) {
          collection.set(command.name, command);
        }
      } catch (err) {
        logger.error('Commands', `Failed to load ${type} command ${entry.name}: ${err.message}`);
      }
    }
  }
}

async function deploySlashCommands(client) {
  const commands = [];
  client.slashCommands.forEach((cmd) => {
    if (cmd.data) commands.push(cmd.data.toJSON());
  });

  if (!commands.length) {
    logger.warn('Deploy', 'No slash commands to deploy');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

  try {
    logger.info('Deploy', `Deploying ${commands.length} slash commands...`);
    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body: commands });
    logger.info('Deploy', 'Slash commands deployed successfully');
  } catch (err) {
    logger.error('Deploy', `Failed to deploy slash commands: ${err.message}`);
  }
}

module.exports = { loadCommands, deploySlashCommands };
