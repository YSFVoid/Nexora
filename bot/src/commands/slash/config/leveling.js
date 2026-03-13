const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { LevelingConfig } = require('../../../models/Modules');
const { successEmbed, createEmbed } = require('../../../utils/embeds');
const { updateGuildConfig } = require('../../../services/configService');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'leveling',
  data: new SlashCommandBuilder()
    .setName('leveling')
    .setDescription('Configure the leveling system')
    .addSubcommand(s => s.setName('enable').setDescription('Enable leveling'))
    .addSubcommand(s => s.setName('disable').setDescription('Disable leveling'))
    .addSubcommand(s => s
      .setName('channel')
      .setDescription('Set level-up announcement channel')
      .addChannelOption(o => o.setName('channel').setDescription('Announcement channel').setRequired(true)))
    .addSubcommand(s => s
      .setName('role-reward')
      .setDescription('Add a role reward for a level')
      .addIntegerOption(o => o.setName('level').setDescription('Level').setRequired(true).setMinValue(1))
      .addRoleOption(o => o.setName('role').setDescription('Reward role').setRequired(true)))
    .addSubcommand(s => s.setName('config').setDescription('View leveling configuration'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'enable') {
      await LevelingConfig.findOneAndUpdate({ guildId }, { enabled: true }, { upsert: true });
      await updateGuildConfig(guildId, { 'modules.leveling': true });
      return interaction.reply({ embeds: [successEmbed('Leveling enabled.')], ephemeral: true });
    }
    if (sub === 'disable') {
      await LevelingConfig.updateOne({ guildId }, { enabled: false });
      await updateGuildConfig(guildId, { 'modules.leveling': false });
      return interaction.reply({ embeds: [successEmbed('Leveling disabled.')], ephemeral: true });
    }
    if (sub === 'channel') {
      const channel = interaction.options.getChannel('channel');
      await LevelingConfig.findOneAndUpdate({ guildId }, { channelId: channel.id }, { upsert: true });
      return interaction.reply({ embeds: [successEmbed(`Level-up announcements set to ${channel}.`)], ephemeral: true });
    }
    if (sub === 'role-reward') {
      const level = interaction.options.getInteger('level');
      const role = interaction.options.getRole('role');
      await LevelingConfig.findOneAndUpdate(
        { guildId },
        { $push: { roleRewards: { level, roleId: role.id } } },
        { upsert: true }
      );
      return interaction.reply({ embeds: [successEmbed(`${role} will be awarded at level **${level}**.`)], ephemeral: true });
    }
    if (sub === 'config') {
      const config = await LevelingConfig.findOne({ guildId });
      const rewards = config?.roleRewards?.map(r => `Level ${r.level}: <@&${r.roleId}>`).join('\n') || 'None';
      return interaction.reply({ embeds: [createEmbed({
        color: Colors.PRIMARY,
        title: '📊 Leveling Configuration',
        description: [
          `**Enabled:** ${config?.enabled ? 'Yes' : 'No'}`,
          `**Channel:** ${config?.channelId ? `<#${config.channelId}>` : 'Current channel'}`,
          `**XP Per Message:** ${config?.xpPerMessage?.min || 15}-${config?.xpPerMessage?.max || 25}`,
          `**Cooldown:** ${(config?.xpCooldown || 60000) / 1000}s`,
          '', '**Role Rewards:**', rewards,
        ].join('\n'),
      })], ephemeral: true });
    }
  },
};
