const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../../../modules/music/musicService');
const { successEmbed, errorEmbed } = require('../../../utils/embeds');

module.exports = {
  name: 'skip',
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),
  async execute(interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || !queue.current) {
      return interaction.reply({ embeds: [errorEmbed('Nothing is playing.')], ephemeral: true });
    }
    const title = queue.current.title;
    queue.skip();
    await interaction.reply({ embeds: [successEmbed(`Skipped: **${title}**`)] });
  },
};
