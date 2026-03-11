const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../../utils/embeds');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'userinfo',
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('View information about a user')
    .addUserOption((o) => o.setName('user').setDescription('User to view')),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const fields = [
      { name: '🏷️ Tag', value: user.tag, inline: true },
      { name: '🆔 ID', value: user.id, inline: true },
      { name: '📅 Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
    ];

    if (member) {
      fields.push(
        { name: '📥 Joined', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: '🏷️ Roles', value: `${member.roles.cache.size - 1}`, inline: true },
        { name: '🎨 Color', value: member.displayHexColor, inline: true },
      );
    }

    await interaction.reply({
      embeds: [createEmbed({
        color: Colors.PRIMARY,
        title: user.tag,
        thumbnail: user.displayAvatarURL({ size: 256 }),
        fields,
      })],
    });
  },
};
