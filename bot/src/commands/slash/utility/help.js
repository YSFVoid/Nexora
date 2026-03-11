const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../../utils/embeds');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'help',
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View available commands and features')
    .addStringOption((o) => o.setName('command').setDescription('Get details about a specific command')),
  async execute(interaction, client) {
    const specific = interaction.options.getString('command');

    if (specific) {
      const cmd = client.slashCommands.get(specific);
      if (!cmd) {
        return interaction.reply({
          embeds: [createEmbed({ color: Colors.WARNING, description: `Command \`/${specific}\` not found.` })],
          ephemeral: true,
        });
      }
      return interaction.reply({
        embeds: [createEmbed({
          color: Colors.PRIMARY,
          title: `/${cmd.name}`,
          description: cmd.data?.description || 'No description available.',
          fields: [
            { name: 'Cooldown', value: cmd.cooldown ? `${cmd.cooldown / 1000}s` : '3s', inline: true },
            { name: 'Admin Only', value: cmd.adminOnly ? 'Yes' : 'No', inline: true },
          ],
        })],
        ephemeral: true,
      });
    }

    const categories = {};
    client.slashCommands.forEach((cmd) => {
      const name = cmd.name;
      let cat = 'General';
      if (['ban', 'kick', 'timeout', 'warn', 'purge', 'cases'].includes(name)) cat = '🛡️ Moderation';
      else if (name === 'setup') cat = '⚙️ Setup';
      else if (['ping', 'help', 'serverinfo', 'userinfo'].includes(name)) cat = '🔧 Utility';
      else if (name === 'ticket') cat = '🎫 Tickets';
      else if (name === 'tempvoice') cat = '🔊 Temp Voice';
      else cat = '📦 Other';

      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(`\`/${name}\` — ${cmd.data?.description || '...'}`);
    });

    const fields = Object.entries(categories).map(([name, cmds]) => ({
      name, value: cmds.join('\n'), inline: false,
    }));

    await interaction.reply({
      embeds: [createEmbed({
        color: Colors.PRIMARY,
        title: '📖 Nexora — Help',
        description: 'Here are all available commands. Use `/help <command>` for details.',
        fields,
        footer: 'Nexora — Premium Discord Bot',
      })],
      ephemeral: true,
    });
  },
};
