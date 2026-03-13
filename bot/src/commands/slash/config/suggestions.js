const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { SuggestionConfig } = require('../../../models/Modules');
const { successEmbed, createEmbed } = require('../../../utils/embeds');
const { updateGuildConfig } = require('../../../services/configService');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'suggestions',
  data: new SlashCommandBuilder()
    .setName('suggestions')
    .setDescription('Configure the suggestion system')
    .addSubcommand(s => s
      .setName('setup')
      .setDescription('Set up suggestions')
      .addChannelOption(o => o.setName('channel').setDescription('Suggestions channel').setRequired(true)))
    .addSubcommand(s => s.setName('disable').setDescription('Disable suggestions'))
    .addSubcommand(s => s.setName('config').setDescription('View suggestion configuration'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'setup') {
      const channel = interaction.options.getChannel('channel');
      await SuggestionConfig.findOneAndUpdate(
        { guildId }, { enabled: true, channelId: channel.id }, { upsert: true }
      );
      await updateGuildConfig(guildId, { 'modules.suggestions': true });
      return interaction.reply({ embeds: [successEmbed(`Suggestions enabled in ${channel}.`)], ephemeral: true });
    }
    if (sub === 'disable') {
      await SuggestionConfig.updateOne({ guildId }, { enabled: false });
      await updateGuildConfig(guildId, { 'modules.suggestions': false });
      return interaction.reply({ embeds: [successEmbed('Suggestions disabled.')], ephemeral: true });
    }
    if (sub === 'config') {
      const config = await SuggestionConfig.findOne({ guildId });
      return interaction.reply({ embeds: [createEmbed({
        color: Colors.PRIMARY,
        title: '💡 Suggestion Configuration',
        description: [
          `**Enabled:** ${config?.enabled ? 'Yes' : 'No'}`,
          `**Channel:** ${config?.channelId ? `<#${config.channelId}>` : 'Not set'}`,
          `**Anonymous:** ${config?.allowAnonymous ? 'Yes' : 'No'}`,
        ].join('\n'),
      })], ephemeral: true });
    }
  },
};
