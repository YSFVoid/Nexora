const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { WelcomeConfig } = require('../../../models/Modules');
const { successEmbed, errorEmbed, createEmbed } = require('../../../utils/embeds');
const { updateGuildConfig } = require('../../../services/configService');
const Colors = require('../../../constants/colors');

module.exports = {
  name: 'welcome',
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Configure welcome messages')
    .addSubcommand(s => s
      .setName('set')
      .setDescription('Set the welcome channel and message')
      .addChannelOption(o => o.setName('channel').setDescription('Welcome channel').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Welcome message ({user} {guild} {memberCount})').setRequired(false)))
    .addSubcommand(s => s.setName('disable').setDescription('Disable welcome messages'))
    .addSubcommand(s => s
      .setName('goodbye')
      .setDescription('Set goodbye channel and message')
      .addChannelOption(o => o.setName('channel').setDescription('Goodbye channel').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Goodbye message').setRequired(false)))
    .addSubcommand(s => s.setName('test').setDescription('Preview the welcome message'))
    .addSubcommand(s => s.setName('config').setDescription('View welcome configuration'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'set') {
      const channel = interaction.options.getChannel('channel');
      const message = interaction.options.getString('message') || 'Welcome to the server, {user}! 🎉';
      await WelcomeConfig.findOneAndUpdate(
        { guildId }, { enabled: true, channelId: channel.id, message }, { upsert: true }
      );
      await updateGuildConfig(guildId, { 'modules.welcome': true });
      return interaction.reply({ embeds: [successEmbed(`Welcome messages enabled in ${channel}.`)], ephemeral: true });
    }

    if (sub === 'disable') {
      await WelcomeConfig.updateOne({ guildId }, { enabled: false });
      await updateGuildConfig(guildId, { 'modules.welcome': false });
      return interaction.reply({ embeds: [successEmbed('Welcome messages disabled.')], ephemeral: true });
    }

    if (sub === 'goodbye') {
      const channel = interaction.options.getChannel('channel');
      const message = interaction.options.getString('message') || '{user} has left the server.';
      await WelcomeConfig.findOneAndUpdate(
        { guildId }, { 'goodbye.enabled': true, 'goodbye.channelId': channel.id, 'goodbye.message': message }, { upsert: true }
      );
      return interaction.reply({ embeds: [successEmbed(`Goodbye messages enabled in ${channel}.`)], ephemeral: true });
    }

    if (sub === 'test') {
      const config = await WelcomeConfig.findOne({ guildId });
      const msg = (config?.message || 'Welcome to the server, {user}! 🎉')
        .replace(/{user}/g, `${interaction.user}`)
        .replace(/{guild}/g, interaction.guild.name)
        .replace(/{memberCount}/g, interaction.guild.memberCount);
      return interaction.reply({ embeds: [createEmbed({
        color: config?.embedColor || Colors.PRIMARY,
        title: config?.embedTitle || 'Welcome!',
        description: msg,
        thumbnail: interaction.user.displayAvatarURL({ size: 256 }),
      })], ephemeral: true });
    }

    if (sub === 'config') {
      const config = await WelcomeConfig.findOne({ guildId });
      return interaction.reply({ embeds: [createEmbed({
        color: Colors.PRIMARY,
        title: '👋 Welcome Configuration',
        description: [
          `**Enabled:** ${config?.enabled ? 'Yes' : 'No'}`,
          `**Channel:** ${config?.channelId ? `<#${config.channelId}>` : 'Not set'}`,
          `**Message:** ${config?.message || 'Default'}`,
          `**Goodbye:** ${config?.goodbye?.enabled ? `<#${config.goodbye.channelId}>` : 'Disabled'}`,
        ].join('\n'),
      })], ephemeral: true });
    }
  },
};
