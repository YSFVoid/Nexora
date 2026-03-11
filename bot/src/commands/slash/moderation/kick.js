const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { canModerate, botCanModerate } = require('../../../utils/permissions');
const { successEmbed, errorEmbed, createEmbed } = require('../../../utils/embeds');
const { createCase } = require('../../../modules/security/securityService');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'kick',
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption((o) => o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the kick'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  permissions: [PermissionFlagsBits.KickMembers],
  cooldown: 5000,
  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ embeds: [errorEmbed('User not found in this server.')], ephemeral: true });
    if (!canModerate(interaction.member, target)) {
      return interaction.reply({ embeds: [errorEmbed('You cannot kick someone with a higher or equal role.')], ephemeral: true });
    }
    if (!botCanModerate(interaction.guild, target)) {
      return interaction.reply({ embeds: [errorEmbed('I cannot kick this user — my role is not high enough.')], ephemeral: true });
    }

    try {
      try { await target.send({ embeds: [createEmbed({ color: Colors.WARNING, title: '👢 You have been kicked', description: `You were kicked from **${interaction.guild.name}**.\n**Reason:** ${reason}` })] }); } catch { }
      await target.kick(`${interaction.user.tag}: ${reason}`);
      await createCase(interaction.guild.id, target.id, interaction.user.id, 'kick', reason);
      await interaction.reply({ embeds: [successEmbed(`**${target.user.tag}** has been kicked.\n**Reason:** ${reason}`)] });
    } catch (err) {
      await interaction.reply({ embeds: [errorEmbed(`Failed to kick: ${err.message}`)], ephemeral: true });
    }
  },
};
