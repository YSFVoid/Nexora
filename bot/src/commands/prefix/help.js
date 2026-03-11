const { createEmbed } = require('../../../utils/embeds');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'help',
  aliases: ['h', 'commands'],
  description: 'View available prefix commands',
  execute(message, args, client) {
    const prefix = client.prefixCommands ? '!' : '!';
    const commands = [];
    client.prefixCommands.forEach((cmd) => {
      commands.push(`\`${prefix}${cmd.name}\` — ${cmd.description || '...'}`);
    });

    const embed = createEmbed({
      color: Colors.PRIMARY,
      title: '📖 Nexora — Prefix Commands',
      description: commands.join('\n') || 'No prefix commands loaded.',
      fields: [
        { name: 'Slash Commands', value: 'Use `/help` for the full slash command list.', inline: false },
      ],
      footer: 'Nexora',
    });

    message.reply({ embeds: [embed] });
  },
};
