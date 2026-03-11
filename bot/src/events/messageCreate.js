const { getGuildConfig } = require('../services/configService');
const { errorEmbed } = require('../utils/embeds');
const { checkPermissions, checkCooldown } = require('../middleware/permissions');
const logger = require('../utils/logger');

module.exports = {
  name: 'messageCreate',
  async execute(client, message) {
    if (message.author.bot || !message.guild) return;

    try {
      const securityService = require('../modules/security/securityService');
      const blocked = await securityService.processMessage(message);
      if (blocked) return;
    } catch { }

    try {
      const levelingService = require('../modules/leveling/levelingService');
      await levelingService.processMessage(message);
    } catch { }

    const guildConfig = await getGuildConfig(message.guild.id);
    const prefix = guildConfig.prefix || '!';

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const command = client.prefixCommands.get(commandName)
      || client.prefixCommands.find((c) => c.aliases && c.aliases.includes(commandName));

    if (!command) return;

    const permError = checkPermissions(message.member, command);
    if (permError) {
      return message.reply({ embeds: [errorEmbed(permError)] });
    }

    const cooldownMs = checkCooldown(client.cooldowns, message.author.id, commandName, command.cooldown);
    if (cooldownMs > 0) {
      const seconds = Math.ceil(cooldownMs / 1000);
      return message.reply({
        embeds: [errorEmbed(`Please wait **${seconds}s** before using this command again.`)],
      });
    }

    try {
      await command.execute(message, args, client, guildConfig);
    } catch (err) {
      logger.error('PrefixCmd', `Error executing ${commandName}: ${err.message}`);
      await message.reply({ embeds: [errorEmbed('An error occurred while executing this command.')] }).catch(() => {});
    }
  },
};
