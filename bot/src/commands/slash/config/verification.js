const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { VerificationConfig } = require('../../../models/Modules');
const { buildVerificationPanel } = require('../../../modules/verification/verificationService');
const { successEmbed, errorEmbed } = require('../../../utils/embeds');
const { updateGuildConfig } = require('../../../services/configService');

module.exports = {
  name: 'verification',
  data: new SlashCommandBuilder()
    .setName('verification')
    .setDescription('Configure member verification')
    .addSubcommand(s => s
      .setName('setup')
      .setDescription('Set up verification')
      .addRoleOption(o => o.setName('role').setDescription('Verified role').setRequired(true))
      .addChannelOption(o => o.setName('channel').setDescription('Verification channel').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Custom verification message').setRequired(false)))
    .addSubcommand(s => s.setName('disable').setDescription('Disable verification'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  permissions: [PermissionFlagsBits.Administrator],
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'setup') {
      await interaction.deferReply({ ephemeral: true });
      const role = interaction.options.getRole('role');
      const channel = interaction.options.getChannel('channel');
      const message = interaction.options.getString('message') || 'Click the button below to verify yourself!';

      const config = await VerificationConfig.findOneAndUpdate(
        { guildId },
        { enabled: true, roleId: role.id, channelId: channel.id, message },
        { upsert: true, new: true }
      );

      const { embed, components } = buildVerificationPanel(config);
      const msg = await channel.send({ embeds: [embed], components });
      await VerificationConfig.updateOne({ guildId }, { messageId: msg.id });
      await updateGuildConfig(guildId, { 'modules.verification': true });

      return interaction.editReply({ embeds: [successEmbed(`Verification set up in ${channel} with role ${role}.`)] });
    }

    if (sub === 'disable') {
      await VerificationConfig.updateOne({ guildId }, { enabled: false });
      await updateGuildConfig(guildId, { 'modules.verification': false });
      return interaction.reply({ embeds: [successEmbed('Verification disabled.')], ephemeral: true });
    }
  },
};
