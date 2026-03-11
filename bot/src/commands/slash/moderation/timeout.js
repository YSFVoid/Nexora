const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { canModerate, botCanModerate } = require('../../../utils/permissions');
const { successEmbed, errorEmbed } = require('../../../utils/embeds');
const { createCase } = require('../../../modules/security/securityService');
const ms = require('ms');

module.exports = {
  name: 'timeout',
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user')
    .addUserOption((o) => o.setName('user').setDescription('User to timeout').setRequired(true))
    .addStringOption((o) => o.setName('duration').setDescription('Duration (e.g. 10m, 1h, 1d)').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the timeout'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  permissions: [PermissionFlagsBits.ModerateMembers],
  cooldown: 5000,
  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ embeds: [errorEmbed('User not found.')], ephemeral: true });
    if (!canModerate(interaction.member, target)) return interaction.reply({ embeds: [errorEmbed('Cannot timeout this user.')], ephemeral: true });
    if (!botCanModerate(interaction.guild, target)) return interaction.reply({ embeds: [errorEmbed('Bot cannot timeout this user.')], ephemeral: true });

    const duration = ms(durationStr);
    if (!duration || duration < 5000 || duration > 2419200000) {
      return interaction.reply({ embeds: [errorEmbed('Invalid duration. Must be between 5 seconds and 28 days.')], ephemeral: true });
    }

    try {
      await target.timeout(duration, `${interaction.user.tag}: ${reason}`);
      await createCase(interaction.guild.id, target.id, interaction.user.id, 'timeout', reason, false, duration);
      await interaction.reply({ embeds: [successEmbed(`**${target.user.tag}** has been timed out for **${durationStr}**.\n**Reason:** ${reason}`)] });
    } catch (err) {
      await interaction.reply({ embeds: [errorEmbed(`Failed: ${err.message}`)], ephemeral: true });
    }
  },
};
