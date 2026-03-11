const { WelcomeConfig } = require('../../models/Modules');
const { getGuildConfig } = require('../../services/configService');
const { createEmbed } = require('../../utils/embeds');
const Colors = require('../../constants/colors');
const logger = require('../../utils/logger');

async function sendWelcome(member) {
  const guildConfig = await getGuildConfig(member.guild.id);
  if (!guildConfig.modules?.welcome) return;

  const config = await WelcomeConfig.findOne({ guildId: member.guild.id });
  if (!config?.enabled || !config.channelId) return;

  const channel = member.guild.channels.cache.get(config.channelId);
  if (!channel) return;

  const message = (config.message || 'Welcome to the server, {user}! 🎉')
    .replace(/{user}/g, `${member}`)
    .replace(/{guild}/g, member.guild.name)
    .replace(/{memberCount}/g, member.guild.memberCount);

  try {
    if (config.embedEnabled !== false) {
      const embed = createEmbed({
        color: config.embedColor || Colors.PRIMARY,
        title: config.embedTitle || 'Welcome!',
        description: message,
        thumbnail: member.user.displayAvatarURL({ size: 256 }),
      });
      if (config.embedImage) embed.setImage(config.embedImage);
      await channel.send({ embeds: [embed] });
    } else {
      await channel.send(message);
    }

    if (config.dmEnabled && config.dmMessage) {
      const dm = config.dmMessage
        .replace(/{user}/g, member.user.tag)
        .replace(/{guild}/g, member.guild.name);
      try { await member.send(dm); } catch { }
    }
  } catch (err) {
    logger.error('Welcome', `Failed to send welcome in ${member.guild.name}: ${err.message}`);
  }
}

async function sendGoodbye(member) {
  const guildConfig = await getGuildConfig(member.guild.id);
  if (!guildConfig.modules?.welcome) return;

  const config = await WelcomeConfig.findOne({ guildId: member.guild.id });
  if (!config?.goodbye?.enabled || !config.goodbye.channelId) return;

  const channel = member.guild.channels.cache.get(config.goodbye.channelId);
  if (!channel) return;

  const message = (config.goodbye.message || '{user} has left the server.')
    .replace(/{user}/g, member.user.tag)
    .replace(/{guild}/g, member.guild.name);

  try {
    await channel.send({ embeds: [createEmbed({ color: Colors.MUTED, description: message })] });
  } catch (err) {
    logger.error('Welcome', `Failed to send goodbye: ${err.message}`);
  }
}

module.exports = { sendWelcome, sendGoodbye };
