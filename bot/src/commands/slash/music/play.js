const { SlashCommandBuilder } = require('discord.js');
const { getQueue, createQueue } = require('../../../modules/music/musicService');
const { successEmbed, errorEmbed, createEmbed } = require('../../../utils/embeds');
const Colors = require('../../../constants/colors');
const play = require('play-dl');

module.exports = {
  name: 'play',
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube')
    .addStringOption(o => o.setName('query').setDescription('Song name or URL').setRequired(true)),
  async execute(interaction) {
    const vc = interaction.member.voice?.channel;
    if (!vc) return interaction.reply({ embeds: [errorEmbed('You must be in a voice channel.')], ephemeral: true });

    await interaction.deferReply();

    const query = interaction.options.getString('query');

    try {
      let info;
      if (play.yt_validate(query) === 'video') {
        info = (await play.video_info(query)).video_details;
      } else {
        const results = await play.search(query, { limit: 1 });
        if (!results.length) return interaction.editReply({ embeds: [errorEmbed('No results found.')] });
        info = results[0];
      }

      const track = {
        title: info.title || 'Unknown',
        url: info.url,
        duration: info.durationRaw || '0:00',
        thumbnail: info.thumbnails?.[0]?.url || null,
        requestedBy: interaction.user.tag,
        getStream: async () => {
          const streamInfo = await play.stream(info.url);
          return streamInfo.stream;
        },
      };

      let queue = getQueue(interaction.guild.id);
      if (!queue) {
        queue = createQueue(interaction.guild.id, vc, interaction.channel);
      }

      queue.enqueue(track);

      if (queue.tracks.length > 0) {
        await interaction.editReply({
          embeds: [createEmbed({
            color: Colors.SUCCESS,
            description: `✅ Added to queue: **${track.title}** (${track.duration})`,
            footer: `Position: ${queue.tracks.length} • Requested by ${track.requestedBy}`,
          })],
        });
      } else {
        await interaction.editReply({
          embeds: [successEmbed(`Now playing: **${track.title}**`)],
        });
      }
    } catch (err) {
      await interaction.editReply({ embeds: [errorEmbed(`Failed to play: ${err.message}`)] });
    }
  },
};
