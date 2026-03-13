const { getQueue } = require('../../modules/music/musicService');
const { createEmbed, errorEmbed, successEmbed } = require('../../utils/embeds');
const Colors = require('../../constants/colors');

module.exports = {
  name: 'np',
  aliases: ['nowplaying', 'playing'],
  description: 'Show current song or skip',
  async execute(message, args) {
    const queue = getQueue(message.guild.id);
    if (!queue || !queue.current) {
      return message.reply({ embeds: [errorEmbed('Nothing is currently playing.')] });
    }

    if (args[0]?.toLowerCase() === 'skip') {
      const title = queue.current.title;
      queue.skip();
      return message.reply({ embeds: [successEmbed(`Skipped: **${title}**`)] });
    }

    const track = queue.current;
    await message.reply({
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
