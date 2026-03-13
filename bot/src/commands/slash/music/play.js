const { SlashCommandBuilder } = require('discord.js');
const musicService = require('../../../modules/music/musicService');
const { warningEmbed } = require('../../../utils/embeds');

module.exports = {
  name: 'play',
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song (Work in Progress)')
    .addStringOption((o) => o.setName('query').setDescription('Song name or URL').setRequired(true)),
  async execute(interaction) {
    await interaction.reply({
      embeds: [warningEmbed('Music module is currently being built and is not yet available.')],
      ephemeral: true,
    });
  },
};
