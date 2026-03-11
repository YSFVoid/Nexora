const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../../utils/embeds');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'serverinfo',
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('View detailed information about this server'),
  async execute(interaction) {
    const guild = interaction.guild;
    await guild.members.fetch().catch(() => {});

    const embed = createEmbed({
      color: Colors.PRIMARY,
      title: guild.name,
      thumbnail: guild.iconURL({ size: 256 }),
      fields: [
        { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
        { name: '💬 Channels', value: `${guild.channels.cache.size}`, inline: true },
        { name: '🏷️ Roles', value: `${guild.roles.cache.size}`, inline: true },
        { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
        { name: '🔒 Verification', value: guild.verificationLevel.toString(), inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '🆔 ID', value: guild.id, inline: true },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
};
