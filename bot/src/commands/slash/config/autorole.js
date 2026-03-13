const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { AutoroleConfig } = require('../../../models/Modules');
const { successEmbed, errorEmbed, createEmbed } = require('../../../utils/embeds');
const { updateGuildConfig } = require('../../../services/configService');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'autorole',
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Configure automatic role assignment')
    .addSubcommand(s => s
      .setName('add')
      .setDescription('Add an autorole')
      .addRoleOption(o => o.setName('role').setDescription('Role to auto-assign').setRequired(true)))
    .addSubcommand(s => s
      .setName('remove')
      .setDescription('Remove an autorole')
      .addRoleOption(o => o.setName('role').setDescription('Role to remove').setRequired(true)))
    .addSubcommand(s => s.setName('enable').setDescription('Enable autorole'))
    .addSubcommand(s => s.setName('disable').setDescription('Disable autorole'))
    .addSubcommand(s => s.setName('config').setDescription('View autorole configuration'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  permissions: [PermissionFlagsBits.ManageRoles],
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'add') {
      const role = interaction.options.getRole('role');
      await AutoroleConfig.findOneAndUpdate({ guildId }, { $addToSet: { roles: role.id }, enabled: true }, { upsert: true });
      await updateGuildConfig(guildId, { 'modules.autorole': true });
      return interaction.reply({ embeds: [successEmbed(`${role} will be auto-assigned to new members.`)], ephemeral: true });
    }
    if (sub === 'remove') {
      const role = interaction.options.getRole('role');
      await AutoroleConfig.updateOne({ guildId }, { $pull: { roles: role.id } });
      return interaction.reply({ embeds: [successEmbed(`${role} removed from autoroles.`)], ephemeral: true });
    }
    if (sub === 'enable') {
      await AutoroleConfig.updateOne({ guildId }, { enabled: true }, { upsert: true });
      await updateGuildConfig(guildId, { 'modules.autorole': true });
      return interaction.reply({ embeds: [successEmbed('Autorole enabled.')], ephemeral: true });
    }
    if (sub === 'disable') {
      await AutoroleConfig.updateOne({ guildId }, { enabled: false });
      await updateGuildConfig(guildId, { 'modules.autorole': false });
      return interaction.reply({ embeds: [successEmbed('Autorole disabled.')], ephemeral: true });
    }
    if (sub === 'config') {
      const config = await AutoroleConfig.findOne({ guildId });
      return interaction.reply({ embeds: [createEmbed({
        color: Colors.PRIMARY,
        title: '🏷️ Autorole Configuration',
        description: [
          `**Enabled:** ${config?.enabled ? 'Yes' : 'No'}`,
          `**Roles:** ${config?.roles?.length ? config.roles.map(r => `<@&${r}>`).join(', ') : 'None'}`,
          `**Delay:** ${config?.delay || 0}ms`,
        ].join('\n'),
      })], ephemeral: true });
    }
  },
};
