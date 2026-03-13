const { createEmbed } = require('../../utils/embeds');
const Colors = require('../../constants/colors');
const Emojis = require('../../constants/emojis');

module.exports = {
  name: 'serverinfo',
  aliases: ['si', 'server'],
  description: 'View server information',
  execute(message) {
    const guild = message.guild;

    const embed = createEmbed({
      color: Colors.PRIMARY,
      title: guild.name,
      thumbnail: guild.iconURL({ size: 256, dynamic: true }),
      fields: [
        { name: `${Emojis.CROWN} Owner`, value: `<@${guild.ownerId}>`, inline: true },
        { name: `${Emojis.MEMBERS} Members`, value: `${guild.memberCount}`, inline: true },
        { name: `${Emojis.CHANNEL} Channels`, value: `${guild.channels.cache.size}`, inline: true },
        { name: `${Emojis.ROLE} Roles`, value: `${guild.roles.cache.size}`, inline: true },
        { name: `${Emojis.STAR} Boosts`, value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
      ],
      footer: `ID: ${guild.id}`,
    });

    message.reply({ embeds: [embed] });
  },
};
