const { EmbedBuilder } = require('discord.js');
const Colors = require('../constants/colors');
const Emojis = require('../constants/emojis');

function createEmbed(options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color || Colors.PRIMARY)
    .setTimestamp();

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.fields) embed.addFields(options.fields);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.footer) {
    embed.setFooter({ text: options.footer, iconURL: options.footerIcon });
  } else {
    embed.setFooter({ text: 'Nexora' });
  }

  return embed;
}

function successEmbed(description, title) {
  return createEmbed({
    color: Colors.SUCCESS,
    title: title ? `${Emojis.SUCCESS} ${title}` : undefined,
    description: `${Emojis.SUCCESS} ${description}`,
  });
}

function errorEmbed(description, title) {
  return createEmbed({
    color: Colors.DANGER,
    title: title ? `${Emojis.ERROR} ${title}` : undefined,
    description: `${Emojis.ERROR} ${description}`,
  });
}

function warningEmbed(description, title) {
  return createEmbed({
    color: Colors.WARNING,
    title: title ? `${Emojis.WARNING} ${title}` : undefined,
    description: `${Emojis.WARNING} ${description}`,
  });
}

function infoEmbed(description, title) {
  return createEmbed({
    color: Colors.INFO,
    title: title ? `${Emojis.INFO} ${title}` : undefined,
    description: `${Emojis.INFO} ${description}`,
  });
}

function loadingEmbed(description) {
  return createEmbed({
    color: Colors.MUTED,
    description: `${Emojis.LOADING} ${description}`,
  });
}

module.exports = { createEmbed, successEmbed, errorEmbed, warningEmbed, infoEmbed, loadingEmbed };
