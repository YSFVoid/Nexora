const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder } = require('discord.js');
const { TicketConfig, Ticket } = require('../../models/Ticket');
const { getGuildConfig } = require('../../services/configService');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embeds');
const Colors = require('../../constants/colors');
const Emojis = require('../../constants/emojis');
const logger = require('../../utils/logger');

const DEFAULT_CATEGORIES = [
  { id: 'support', name: 'General Support', emoji: '💬', description: 'Get help with general questions' },
  { id: 'bug', name: 'Bug Report', emoji: '🐛', description: 'Report a bug or issue' },
  { id: 'purchase', name: 'Purchase / Billing', emoji: '💰', description: 'Questions about purchases' },
  { id: 'report', name: 'Report a User', emoji: '🚨', description: 'Report rule-breaking behavior' },
];

async function getTicketConfig(guildId) {
  let config = await TicketConfig.findOne({ guildId });
  if (!config) {
    config = await TicketConfig.create({ guildId, categories: DEFAULT_CATEGORIES });
  }
  return config.toObject();
}

async function deployPanel(guild, channelId, config) {
  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel) throw new Error('Panel channel not found');

  const categories = config.categories || DEFAULT_CATEGORIES;

  const embed = createEmbed({
    color: Colors.PRIMARY,
    title: `${Emojis.TICKET} Support Tickets`,
    description: [
      'Need help? We\'re here for you!',
      '',
      'Select a category below to create a ticket.',
      'Our team will assist you as soon as possible.',
      '',
      categories.map((c) => `${c.emoji} **${c.name}** — ${c.description}`).join('\n'),
    ].join('\n'),
    footer: 'Nexora Ticket System',
  });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket:create')
    .setPlaceholder('📩 Select a category to create a ticket...')
    .addOptions(
      categories.map((c) => ({
        label: c.name, value: c.id, emoji: c.emoji, description: c.description.slice(0, 100),
      }))
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);

  if (config.panelMessageId) {
    try {
      const existing = await channel.messages.fetch(config.panelMessageId).catch(() => null);
      if (existing) {
        await existing.edit({ embeds: [embed], components: [row] });
        return existing;
      }
    } catch { }
  }

  const msg = await channel.send({ embeds: [embed], components: [row] });
  await TicketConfig.updateOne(
    { guildId: guild.id },
    { panelChannelId: channelId, panelMessageId: msg.id }
  );
  return msg;
}

async function handleSelectMenu(interaction, action) {
  if (action !== 'create') return;

  const categoryId = interaction.values[0];
  const guild = interaction.guild;
  const user = interaction.user;

  await interaction.deferReply({ ephemeral: true });

  const config = await getTicketConfig(guild.id);

  const openTickets = await Ticket.countDocuments({
    guildId: guild.id, userId: user.id, status: { $in: ['open', 'claimed'] },
  });

  if (openTickets >= (config.maxTicketsPerUser || 3)) {
    return interaction.editReply({
      embeds: [errorEmbed(`You already have the maximum of **${config.maxTicketsPerUser || 3}** open tickets.`)],
    });
  }

  const lastTicket = await Ticket.findOne({ guildId: guild.id }).sort({ ticketNumber: -1 });
  const ticketNumber = (lastTicket?.ticketNumber || 0) + 1;
  const category = (config.categories || DEFAULT_CATEGORIES).find((c) => c.id === categoryId) || DEFAULT_CATEGORIES[0];
  const channelName = `ticket-${ticketNumber.toString().padStart(4, '0')}`;

  const permissionOverwrites = [
    { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
    { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
    { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
  ];

  const staffRoles = [...new Set([...(config.staffRoles || []), ...(category.staffRoles || [])])];
  for (const roleId of staffRoles) {
    permissionOverwrites.push({
      id: roleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
    });
  }

  try {
    const ticketChannel = await guild.channels.create({
      name: channelName, type: ChannelType.GuildText,
      parent: category.categoryChannelId || null, permissionOverwrites,
    });

    await Ticket.create({
      guildId: guild.id, channelId: ticketChannel.id, userId: user.id, ticketNumber, categoryId,
    });

    const greeting = createEmbed({
      color: Colors.PRIMARY,
      title: `${category.emoji} ${category.name} — Ticket #${ticketNumber}`,
      description: [
        `Welcome ${user}!`, '',
        'A staff member will be with you shortly.',
        'Please describe your issue in detail.', '',
        `**Category:** ${category.name}`,
        `**Priority:** Normal`,
      ].join('\n'),
      footer: `Ticket #${ticketNumber} • Nexora`,
    });

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket:close').setLabel('Close Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('ticket:claim').setLabel('Claim').setEmoji('📌').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ticket:transcript').setLabel('Transcript').setEmoji('📋').setStyle(ButtonStyle.Secondary),
    );

    await ticketChannel.send({ content: `${user} | ${staffRoles.map((r) => `<@&${r}>`).join(' ')}`, embeds: [greeting], components: [actionRow] });
    await interaction.editReply({ embeds: [successEmbed(`Your ticket has been created! ${ticketChannel}`)] });

    if (config.logChannelId) {
      const logChannel = await guild.channels.fetch(config.logChannelId).catch(() => null);
      if (logChannel) {
        await logChannel.send({
          embeds: [createEmbed({
            color: Colors.INFO,
            title: `${Emojis.TICKET} Ticket Created`,
            fields: [
              { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
              { name: 'Category', value: category.name, inline: true },
              { name: 'Channel', value: `${ticketChannel}`, inline: true },
              { name: 'Ticket', value: `#${ticketNumber}`, inline: true },
            ],
          })],
        });
      }
    }
  } catch (err) {
    logger.error('Tickets', `Failed to create ticket: ${err.message}`);
    await interaction.editReply({ embeds: [errorEmbed('Failed to create ticket. Please try again.')] });
  }
}

async function handleButton(interaction, action) {
  switch (action) {
    case 'close': return closeTicket(interaction);
    case 'reopen': return reopenTicket(interaction);
    case 'delete': return deleteTicket(interaction);
    case 'claim': return claimTicket(interaction);
    case 'transcript': return generateTranscript(interaction);
    default: return interaction.reply({ embeds: [errorEmbed('Unknown action.')], ephemeral: true });
  }
}

async function closeTicket(interaction) {
  const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
  if (!ticket) return interaction.reply({ embeds: [errorEmbed('This is not a ticket channel.')], ephemeral: true });
  if (ticket.status === 'closed') return interaction.reply({ embeds: [errorEmbed('This ticket is already closed.')], ephemeral: true });

  await Ticket.updateOne({ channelId: ticket.channelId }, { status: 'closed', closedAt: new Date(), closedBy: interaction.user.id });
  await interaction.channel.permissionOverwrites.edit(ticket.userId, { SendMessages: false }).catch(() => {});

  const embed = createEmbed({
    color: Colors.WARNING,
    title: '🔒 Ticket Closed',
    description: `This ticket was closed by ${interaction.user}.\nUse the buttons below to manage this ticket.`,
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:reopen').setLabel('Reopen').setEmoji('🔓').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('ticket:delete').setLabel('Delete').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket:transcript').setLabel('Save Transcript').setEmoji('📋').setStyle(ButtonStyle.Secondary),
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}

async function reopenTicket(interaction) {
  const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
  if (!ticket) return interaction.reply({ embeds: [errorEmbed('This is not a ticket channel.')], ephemeral: true });

  await Ticket.updateOne({ channelId: ticket.channelId }, { status: 'open', closedAt: null, closedBy: null });
  await interaction.channel.permissionOverwrites.edit(ticket.userId, { SendMessages: true }).catch(() => {});
  await interaction.reply({ embeds: [successEmbed(`Ticket reopened by ${interaction.user}.`)] });
}

async function deleteTicket(interaction) {
  await interaction.reply({ embeds: [createEmbed({ color: Colors.DANGER, description: '🗑️ This ticket will be deleted in **5 seconds**...' })] });
  await Ticket.deleteOne({ channelId: interaction.channel.id });
  setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
}

async function claimTicket(interaction) {
  const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
  if (!ticket) return interaction.reply({ embeds: [errorEmbed('This is not a ticket channel.')], ephemeral: true });

  if (ticket.claimedBy) {
    return interaction.reply({ embeds: [errorEmbed(`This ticket is already claimed by <@${ticket.claimedBy}>.`)], ephemeral: true });
  }

  await Ticket.updateOne({ channelId: ticket.channelId }, { claimedBy: interaction.user.id, status: 'claimed' });
  await interaction.reply({ embeds: [successEmbed(`Ticket claimed by ${interaction.user}.`)] });
}

async function generateTranscript(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const sorted = [...messages.values()].reverse();

    let transcript = `# Ticket Transcript\n**Channel:** ${interaction.channel.name}\n**Date:** ${new Date().toISOString()}\n---\n\n`;
    for (const msg of sorted) {
      const time = msg.createdAt.toISOString().replace('T', ' ').slice(0, 19);
      transcript += `[${time}] ${msg.author.tag}: ${msg.content || '[embed/attachment]'}\n`;
    }

    const config = await getTicketConfig(interaction.guild.id);
    if (config.transcriptChannelId) {
      const transcriptChannel = await interaction.guild.channels.fetch(config.transcriptChannelId).catch(() => null);
      if (transcriptChannel) {
        await transcriptChannel.send({
          embeds: [createEmbed({ color: Colors.INFO, title: `📋 Transcript — ${interaction.channel.name}`, description: `Saved by ${interaction.user}` })],
          files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: `${interaction.channel.name}.txt` }],
        });
      }
    }

    await interaction.editReply({
      embeds: [successEmbed('Transcript saved.')],
      files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: `${interaction.channel.name}.txt` }],
    });
  } catch (err) {
    logger.error('Tickets', `Transcript error: ${err.message}`);
    await interaction.editReply({ embeds: [errorEmbed('Failed to generate transcript.')] });
  }
}

module.exports = { getTicketConfig, deployPanel, handleSelectMenu, handleButton, DEFAULT_CATEGORIES };
