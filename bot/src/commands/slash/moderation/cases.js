const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationCase = require('../../../models/ModerationCase');
const { createEmbed, errorEmbed } = require('../../../utils/embeds');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'cases',
  data: new SlashCommandBuilder()
    .setName('cases')
    .setDescription('View moderation cases for a user')
    .addUserOption((o) => o.setName('user').setDescription('User to view cases for').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const cases = await ModerationCase.find({ guildId: interaction.guild.id, userId: user.id }).sort({ caseNumber: -1 }).limit(15);

    if (cases.length === 0) {
      return interaction.reply({ embeds: [createEmbed({ description: `No moderation cases found for **${user.tag}**.` })], ephemeral: true });
    }

    const list = cases.map((c) => {
      const time = c.createdAt ? `<t:${Math.floor(c.createdAt.getTime() / 1000)}:R>` : 'Unknown';
      return `**#${c.caseNumber}** | ${c.action.toUpperCase()} | ${time}\n> ${c.reason}${c.automated ? ' *(auto)*' : ''}`;
    }).join('\n\n');

    const embed = createEmbed({
      color: Colors.INFO,
      title: `📋 Cases for ${user.tag}`,
      description: list,
      footer: `${cases.length} case(s) shown`,
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
