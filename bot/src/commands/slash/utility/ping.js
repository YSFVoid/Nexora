const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../../utils/embeds');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'ping',
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency'),
  async execute(interaction) {
    const sent = await interaction.deferReply({ fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const ws = interaction.client.ws.ping;

    await interaction.editReply({
      embeds: [createEmbed({
        color: Colors.PRIMARY,
        title: '🏓 Pong!',
        fields: [
          { name: 'Roundtrip', value: `\`${roundtrip}ms\``, inline: true },
          { name: 'WebSocket', value: `\`${ws}ms\``, inline: true },
        ],
      })],
    });
  },
};
