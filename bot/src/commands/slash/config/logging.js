const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { LoggingConfig } = require('../../../models/Modules');
const { successEmbed, createEmbed } = require('../../../utils/embeds');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'logging',
  data: new SlashCommandBuilder()
    .setName('logging')
    .setDescription('Configure logging channels')
    .addSubcommand(s => s
      .setName('set')
      .setDescription('Set a log channel')
      .addStringOption(o => o.setName('type').setDescription('Log type').setRequired(true)
        .addChoices(
          { name: 'Moderation', value: 'modLogChannelId' },
          { name: 'Security', value: 'securityLogChannelId' },
          { name: 'Tickets', value: 'ticketLogChannelId' },
          { name: 'Join/Leave', value: 'joinLeaveLogChannelId' },
          { name: 'Messages', value: 'messageLogChannelId' },
          { name: 'Voice', value: 'voiceLogChannelId' },
        ))
      .addChannelOption(o => o.setName('channel').setDescription('Log channel').setRequired(true)))
    .addSubcommand(s => s.setName('config').setDescription('View logging configuration'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'set') {
      const type = interaction.options.getString('type');
      const channel = interaction.options.getChannel('channel');
      await LoggingConfig.findOneAndUpdate({ guildId }, { [type]: channel.id }, { upsert: true });
      const label = type.replace(/([A-Z])/g, ' $1').replace('Channel Id', '').trim();
      return interaction.reply({ embeds: [successEmbed(`${label} log channel set to ${channel}.`)], ephemeral: true });
    }

    if (sub === 'config') {
      const config = await LoggingConfig.findOne({ guildId });
      const ch = (id) => id ? `<#${id}>` : 'Not set';
      return interaction.reply({ embeds: [createEmbed({
        color: Colors.PRIMARY,
        title: '📋 Logging Configuration',
        description: [
          `**Moderation:** ${ch(config?.modLogChannelId)}`,
          `**Security:** ${ch(config?.securityLogChannelId)}`,
          `**Tickets:** ${ch(config?.ticketLogChannelId)}`,
          `**Join/Leave:** ${ch(config?.joinLeaveLogChannelId)}`,
          `**Messages:** ${ch(config?.messageLogChannelId)}`,
          `**Voice:** ${ch(config?.voiceLogChannelId)}`,
        ].join('\n'),
      })], ephemeral: true });
    }
  },
};
