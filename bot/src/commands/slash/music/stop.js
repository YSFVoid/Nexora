const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../../../modules/music/musicService');
const { successEmbed, errorEmbed } = require('../../../utils/embeds');

module.exports = {
  name: 'stop',
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop music and clear the queue'),
  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue) {
      return interaction.reply({ embeds: [errorEmbed('Nothing is playing.')], ephemeral: true });
    }
    queue.destroy();
    await interaction.reply({ embeds: [successEmbed('Music stopped and queue cleared.')] });
  },
};
