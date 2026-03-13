const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../../../modules/music/musicService');
const { createEmbed, errorEmbed } = require('../../../utils/embeds');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'queue',
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('View the current music queue'),
  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || (!queue.current && queue.tracks.length === 0)) {
      return interaction.reply({ embeds: [errorEmbed('The queue is empty.')], ephemeral: true });
    }

    const lines = [];
    if (queue.current) {
      lines.push(`🎵 **Now Playing:** ${queue.current.title} (${queue.current.duration})`);
      lines.push('');
    }

    if (queue.tracks.length > 0) {
      lines.push('**Up Next:**');
      queue.tracks.slice(0, 10).forEach((t, i) => {
        lines.push(`\`${i + 1}.\` ${t.title} (${t.duration})`);
      });
      if (queue.tracks.length > 10) {
        lines.push(`\n*...and ${queue.tracks.length - 10} more*`);
      }
    } else {
      lines.push('*No more tracks in queue*');
    }

    await interaction.reply({
      embeds: [createEmbed({
        color: Colors.PRIMARY,
        title: '🎶 Music Queue',
        description: lines.join('\n'),
        footer: `${queue.tracks.length} track(s) in queue`,
      })],
    });
  },
};
