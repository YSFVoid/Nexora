const { createEmbed } = require('../../utils/embeds');
const Colors = require('../../constants/colors');

module.exports = {
  name: 'ping',
  aliases: ['latency', 'pong'],
  description: 'Check bot latency',
  execute(message, args, client) {
    const ws = client.ws.ping;
    const embed = createEmbed({
      color: Colors.SUCCESS,
      title: '🏓 Pong!',
      fields: [
        { name: 'WebSocket', value: `\`${ws}ms\``, inline: true },
        { name: 'Uptime', value: `\`${formatUptime(client.uptime)}\``, inline: true },
      ],
    });

    message.reply({ embeds: [embed] });
  },
};

function formatUptime(ms) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000) % 24;
  const d = Math.floor(ms / 86400000);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}
