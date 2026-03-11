const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { canModerate, botCanModerate } = require('../../../utils/permissions');
const { successEmbed, errorEmbed, createEmbed } = require('../../../utils/embeds');
const { createCase } = require('../../../modules/security/securityService');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'ban',
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption((o) => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the ban'))
    .addIntegerOption((o) => o.setName('delete_days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  permissions: [PermissionFlagsBits.BanMembers],
  cooldown: 5000,
  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;

    if (target) {
      if (!canModerate(interaction.member, target)) {
        return interaction.reply({ embeds: [errorEmbed('You cannot ban someone with a higher or equal role.')], ephemeral: true });
      }
      if (!botCanModerate(interaction.guild, target)) {
        return interaction.reply({ embeds: [errorEmbed('I cannot ban this user — my role is not high enough.')], ephemeral: true });
      }
    }

    try {
      try {
        await user.send({ embeds: [createEmbed({
          color: Colors.DANGER, title: '🔨 You have been banned',
          description: `You were banned from **${interaction.guild.name}**.\n**Reason:** ${reason}`,
        })] });
      } catch { }

      await interaction.guild.members.ban(user, { reason: `${interaction.user.tag}: ${reason}`, deleteMessageSeconds: deleteDays * 86400 });
      await createCase(interaction.guild.id, user.id, interaction.user.id, 'ban', reason);

      await interaction.reply({ embeds: [successEmbed(`**${user.tag}** has been banned.\n**Reason:** ${reason}`)] });
    } catch (err) {
      await interaction.reply({ embeds: [errorEmbed(`Failed to ban: ${err.message}`)], ephemeral: true });
    }
  },
};
