const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../../../modules/music/musicService');
const { createEmbed, errorEmbed } = require('../../../utils/embeds');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'nowplaying',
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the currently playing song'),
  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || !queue.current) {
      return interaction.reply({ embeds: [errorEmbed('Nothing is currently playing.')], ephemeral: true });
    }

    const track = queue.current;
    await interaction.reply({
      embeds: [createEmbed({
        color: Colors.PRIMARY,
        title: '🎵 Now Playing',
        description: `**${track.title}**\nDuration: ${track.duration}`,
        thumbnail: track.thumbnail,
        footer: `Requested by ${track.requestedBy}`,
      })],
    });
  },
};
