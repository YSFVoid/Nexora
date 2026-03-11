const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { VerificationConfig } = require('../../models/Modules');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embeds');
const Colors = require('../../constants/colors');
const logger = require('../../utils/logger');

async function handleButton(interaction, action) {
  if (action !== 'verify') return;

  const config = await VerificationConfig.findOne({ guildId: interaction.guild.id });
  if (!config?.enabled || !config.roleId) {
    return interaction.reply({ embeds: [errorEmbed('Verification is not configured.')], ephemeral: true });
  }

  const member = interaction.member;
  if (member.roles.cache.has(config.roleId)) {
    return interaction.reply({ embeds: [errorEmbed('You are already verified!')], ephemeral: true });
  }

  try {
    await member.roles.add(config.roleId, '[Nexora] Verification');
    await interaction.reply({ embeds: [successEmbed('You have been verified! ✅')], ephemeral: true });
  } catch (err) {
    logger.error('Verify', `Failed to verify ${member.user.tag}: ${err.message}`);
    await interaction.reply({ embeds: [errorEmbed('Verification failed. Please contact staff.')], ephemeral: true });
  }
}

function buildVerificationPanel(config) {
  const embed = createEmbed({
    color: Colors.PRIMARY,
    title: '✅ Server Verification',
    description: config?.message || 'Click the button below to verify yourself and gain access to the server!',
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('verify:verify').setLabel('Verify').setEmoji('✅').setStyle(ButtonStyle.Success)
  );

  return { embed, components: [row] };
}

module.exports = { handleButton, buildVerificationPanel };
