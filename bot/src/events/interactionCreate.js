const { checkPermissions, checkCooldown } = require('../middleware/permissions');
const { errorEmbed } = require('../utils/embeds');
const { getGuildConfig } = require('../services/configService');
const logger = require('../utils/logger');

module.exports = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    if (interaction.isChatInputCommand()) {
      return handleSlashCommand(client, interaction);
    }

    if (interaction.isButton()) {
      return handleButton(client, interaction);
    }

    if (interaction.isStringSelectMenu()) {
      return handleSelectMenu(client, interaction);
    }

    if (interaction.isModalSubmit()) {
      return handleModal(client, interaction);
    }
  },
};

async function handleSlashCommand(client, interaction) {
  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;

  const permError = checkPermissions(interaction.member, command);
  if (permError) {
    return interaction.reply({ embeds: [errorEmbed(permError)], ephemeral: true });
  }

  const cooldownMs = checkCooldown(
    client.cooldowns, interaction.user.id, interaction.commandName, command.cooldown
  );
  if (cooldownMs > 0) {
    const seconds = Math.ceil(cooldownMs / 1000);
    return interaction.reply({
      embeds: [errorEmbed(`Please wait **${seconds}s** before using this command again.`)],
      ephemeral: true,
    });
  }

  try {
    const guildConfig = interaction.guild ? await getGuildConfig(interaction.guild.id) : null;
    await command.execute(interaction, client, guildConfig);
  } catch (err) {
    logger.error('Command', `Error executing /${interaction.commandName}: ${err.message}`);
    const reply = { embeds: [errorEmbed('An error occurred while executing this command.')], ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
}

async function handleButton(client, interaction) {
  const [module, action, ...args] = interaction.customId.split(':');

  try {
    switch (module) {
      case 'tempvoice': {
        const tvService = require('../modules/tempvoice/tempVoiceService');
        return tvService.handleButton(interaction, action, args);
      }
      case 'ticket': {
        const ticketService = require('../modules/tickets/ticketService');
        return ticketService.handleButton(interaction, action, args);
      }
      case 'verify': {
        const verifyService = require('../modules/verification/verificationService');
        return verifyService.handleButton(interaction, action, args);
      }
      case 'setup': {
        const setupWizard = require('../modules/setup/setupWizard');
        return setupWizard.handleButton(interaction, action, args);
      }
    }
  } catch (err) {
    logger.error('Button', `Error handling button ${interaction.customId}: ${err.message}`);
    await interaction.reply({ embeds: [errorEmbed('An error occurred.')], ephemeral: true }).catch(() => {});
  }
}

async function handleSelectMenu(client, interaction) {
  const [module, action] = interaction.customId.split(':');

  try {
    switch (module) {
      case 'ticket': {
        const ticketService = require('../modules/tickets/ticketService');
        return ticketService.handleSelectMenu(interaction, action);
      }
      case 'setup': {
        const setupWizard = require('../modules/setup/setupWizard');
        return setupWizard.handleSelectMenu(interaction, action);
      }
    }
  } catch (err) {
    logger.error('Select', `Error handling select ${interaction.customId}: ${err.message}`);
    await interaction.reply({ embeds: [errorEmbed('An error occurred.')], ephemeral: true }).catch(() => {});
  }
}

async function handleModal(client, interaction) {
  const [module, action] = interaction.customId.split(':');

  try {
    switch (module) {
      case 'tempvoice': {
        const tvService = require('../modules/tempvoice/tempVoiceService');
        return tvService.handleModal(interaction, action);
      }
    }
  } catch (err) {
    logger.error('Modal', `Error handling modal ${interaction.customId}: ${err.message}`);
    await interaction.reply({ embeds: [errorEmbed('An error occurred.')], ephemeral: true }).catch(() => {});
  }
}
