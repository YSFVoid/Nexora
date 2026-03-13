const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { TempVoiceConfig } = require('../../../models/TempVoice');
const { buildControlPanel, invalidateConfigCache } = require('../../../modules/tempvoice/tempVoiceService');
const { successEmbed, errorEmbed } = require('../../../utils/embeds');
const { updateGuildConfig } = require('../../../services/configService');

module.exports = {
  name: 'tempvoice',
  data: new SlashCommandBuilder()
    .setName('tempvoice')
    .setDescription('Configure temporary voice channels')
    .addSubcommand((s) => s.setName('setup').setDescription('Set up temp voice (creates channel + panel)'))
    .addSubcommand((s) => s.setName('panel').setDescription('Send the control panel to the current channel'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  permissions: [PermissionFlagsBits.Administrator],
  adminOnly: true,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'setup') return setupTempVoice(interaction);
    if (sub === 'panel') return sendPanel(interaction);
  },
};

async function setupTempVoice(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  let config = await TempVoiceConfig.findOne({ guildId: guild.id });

  try {
    let category;
    if (config?.categoryId) {
      category = guild.channels.cache.get(config.categoryId);
    }
    if (!category) {
      category = await guild.channels.create({ name: '🔊 Temp Voice', type: ChannelType.GuildCategory });
    }

    let creatorChannel;
    if (config?.creatorChannelId) {
      creatorChannel = guild.channels.cache.get(config.creatorChannelId);
    }
    if (!creatorChannel) {
      creatorChannel = await guild.channels.create({
        name: '➕ Create Room', type: ChannelType.GuildVoice, parent: category.id,
      });
    }

    let controlChannel;
    if (config?.controlPanelChannelId) {
        controlChannel = guild.channels.cache.get(config.controlPanelChannelId);
    }
    if (!controlChannel) {
        controlChannel = await guild.channels.create({
            name: '🔧-room-controls', type: ChannelType.GuildText, parent: category.id,
        });
    }

    await TempVoiceConfig.findOneAndUpdate(
      { guildId: guild.id },
      { creatorChannelId: creatorChannel.id, categoryId: category.id, controlPanelChannelId: controlChannel.id },
      { upsert: true, new: true }
    );

    await updateGuildConfig(guild.id, { 'modules.tempvoice': true });
    invalidateConfigCache(guild.id);

    // Delete the old panel message if it exists in the control room to avoid duplicates
    if (config?.controlPanelMessageId) {
        try {
            const oldMsg = await controlChannel.messages.fetch(config.controlPanelMessageId);
            if (oldMsg) await oldMsg.delete();
        } catch {}
    }

    const { embed, components } = buildControlPanel();
    const panelMsg = await controlChannel.send({ embeds: [embed], components });

    await TempVoiceConfig.updateOne(
      { guildId: guild.id },
      { controlPanelMessageId: panelMsg.id }
    );

    await interaction.editReply({
      embeds: [successEmbed(
        `Temp voice is set up!\n\n**Category:** ${category.name}\n**Creator Channel:** ${creatorChannel}\n**Control Panel:** ${controlChannel}`
      )],
    });
  } catch (err) {
    await interaction.editReply({ embeds: [errorEmbed(`Setup failed: ${err.message}`)] });
  }
}

async function sendPanel(interaction) {
  const { embed, components } = buildControlPanel();
  await interaction.channel.send({ embeds: [embed], components });
  await interaction.reply({ embeds: [successEmbed('Control panel sent!')], ephemeral: true });
}
