const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { TicketConfig } = require('../../../models/Ticket');
const { deployPanel, getTicketConfig, DEFAULT_CATEGORIES } = require('../../../modules/tickets/ticketService');
const { successEmbed, errorEmbed, createEmbed } = require('../../../utils/embeds');
const { updateGuildConfig } = require('../../../services/configService');
const Colors = require('../../../constants/colors');
const Emojis = require('../../../constants/emojis');

module.exports = {
  name: 'ticket',
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket system management')
    .addSubcommand(s => s.setName('setup').setDescription('Set up the ticket system in the current channel'))
    .addSubcommand(s => s.setName('panel').setDescription('Deploy the ticket panel to the current channel'))
    .addSubcommand(s => s.setName('close').setDescription('Close the current ticket'))
    .addSubcommand(s => s.setName('add').setDescription('Add a member to the current ticket')
      .addUserOption(o => o.setName('user').setDescription('User to add').setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove a member from the current ticket')
      .addUserOption(o => o.setName('user').setDescription('User to remove').setRequired(true)))
    .addSubcommand(s => s
      .setName('category-add')
      .setDescription('Add a ticket category')
      .addStringOption(o => o.setName('id').setDescription('Category ID (e.g. "billing")').setRequired(true))
      .addStringOption(o => o.setName('name').setDescription('Category display name').setRequired(true))
      .addStringOption(o => o.setName('emoji').setDescription('Emoji for the category').setRequired(false))
      .addStringOption(o => o.setName('description').setDescription('Short description').setRequired(false)))
    .addSubcommand(s => s
      .setName('category-remove')
      .setDescription('Remove a ticket category')
      .addStringOption(o => o.setName('id').setDescription('Category ID to remove').setRequired(true)))
    .addSubcommand(s => s
      .setName('staff-role')
      .setDescription('Add or remove a staff role')
      .addRoleOption(o => o.setName('role').setDescription('Staff role').setRequired(true))
      .addStringOption(o => o.setName('operation').setDescription('Add or remove').setRequired(true)
        .addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' })))
    .addSubcommand(s => s
      .setName('log-channel')
      .setDescription('Set the ticket log channel')
      .addChannelOption(o => o.setName('channel').setDescription('Log channel').setRequired(true)))
    .addSubcommand(s => s
      .setName('transcript-channel')
      .setDescription('Set the transcript archive channel')
      .addChannelOption(o => o.setName('channel').setDescription('Transcript channel').setRequired(true)))
    .addSubcommand(s => s
      .setName('max-tickets')
      .setDescription('Set max open tickets per user')
      .addIntegerOption(o => o.setName('max').setDescription('Maximum (1-10)').setRequired(true).setMinValue(1).setMaxValue(10)))
    .addSubcommand(s => s.setName('config').setDescription('View current ticket configuration'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case 'setup': return ticketSetup(interaction);
      case 'panel': return ticketPanel(interaction);
      case 'close': return ticketClose(interaction);
      case 'add': return ticketAddMember(interaction);
      case 'remove': return ticketRemoveMember(interaction);
      case 'category-add': return categoryAdd(interaction);
      case 'category-remove': return categoryRemove(interaction);
      case 'staff-role': return staffRole(interaction);
      case 'log-channel': return logChannel(interaction);
      case 'transcript-channel': return transcriptChannel(interaction);
      case 'max-tickets': return maxTickets(interaction);
      case 'config': return showConfig(interaction);
    }
  },
};

async function ticketSetup(interaction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    await TicketConfig.updateOne(
      { guildId: interaction.guild.id },
      { enabled: true, panelChannelId: interaction.channel.id },
      { upsert: true }
    );
    await updateGuildConfig(interaction.guild.id, { 'modules.tickets': true });
    const updatedConfig = await getTicketConfig(interaction.guild.id);
    await deployPanel(interaction.guild, interaction.channel.id, updatedConfig);
    await interaction.editReply({ embeds: [successEmbed('Ticket system set up! Panel deployed below.')] });
  } catch (err) {
    await interaction.editReply({ embeds: [errorEmbed(`Setup failed: ${err.message}`)] });
  }
}

async function ticketPanel(interaction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    const config = await getTicketConfig(interaction.guild.id);
    await deployPanel(interaction.guild, interaction.channel.id, config);
    await interaction.editReply({ embeds: [successEmbed('Ticket panel deployed!')] });
  } catch (err) {
    await interaction.editReply({ embeds: [errorEmbed(`Failed: ${err.message}`)] });
  }
}

async function ticketClose(interaction) {
  const { Ticket } = require('../../../models/Ticket');
  const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
  if (!ticket) return interaction.reply({ embeds: [errorEmbed('This is not a ticket channel.')], ephemeral: true });
  const ticketService = require('../../../modules/tickets/ticketService');
  await ticketService.handleButton(interaction, 'close', []);
}

async function ticketAddMember(interaction) {
  const user = interaction.options.getUser('user');
  const { Ticket } = require('../../../models/Ticket');
  const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
  if (!ticket) return interaction.reply({ embeds: [errorEmbed('This is not a ticket channel.')], ephemeral: true });
  await interaction.channel.permissionOverwrites.edit(user, { ViewChannel: true, SendMessages: true });
  await Ticket.updateOne({ channelId: interaction.channel.id }, { $addToSet: { addedMembers: user.id } });
  await interaction.reply({ embeds: [successEmbed(`**${user.tag}** has been added to this ticket.`)] });
}

async function ticketRemoveMember(interaction) {
  const user = interaction.options.getUser('user');
  const { Ticket } = require('../../../models/Ticket');
  const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
  if (!ticket) return interaction.reply({ embeds: [errorEmbed('This is not a ticket channel.')], ephemeral: true });
  await interaction.channel.permissionOverwrites.delete(user).catch(() => {});
  await Ticket.updateOne({ channelId: interaction.channel.id }, { $pull: { addedMembers: user.id } });
  await interaction.reply({ embeds: [successEmbed(`**${user.tag}** has been removed from this ticket.`)] });
}

async function categoryAdd(interaction) {
  const id = interaction.options.getString('id').toLowerCase().replace(/\s+/g, '-').slice(0, 25);
  const name = interaction.options.getString('name').slice(0, 100);
  const emoji = interaction.options.getString('emoji') || '🎫';
  const description = (interaction.options.getString('description') || '').slice(0, 100);

  const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
  if (config?.categories?.length >= 25) {
    return interaction.reply({ embeds: [errorEmbed('Maximum of 25 categories reached.')], ephemeral: true });
  }
  if (config?.categories?.some(c => c.id === id)) {
    return interaction.reply({ embeds: [errorEmbed(`Category \`${id}\` already exists.`)], ephemeral: true });
  }

  await TicketConfig.updateOne(
    { guildId: interaction.guild.id },
    { $push: { categories: { id, name, emoji, description } } },
    { upsert: true }
  );
  await interaction.reply({ embeds: [successEmbed(`Category **${name}** (\`${id}\`) added.`)], ephemeral: true });
}

async function categoryRemove(interaction) {
  const id = interaction.options.getString('id');
  await TicketConfig.updateOne(
    { guildId: interaction.guild.id },
    { $pull: { categories: { id } } }
  );
  await interaction.reply({ embeds: [successEmbed(`Category \`${id}\` removed.`)], ephemeral: true });
}

async function staffRole(interaction) {
  const role = interaction.options.getRole('role');
  const op = interaction.options.getString('operation');
  const update = op === 'add'
    ? { $addToSet: { staffRoles: role.id } }
    : { $pull: { staffRoles: role.id } };
  await TicketConfig.updateOne({ guildId: interaction.guild.id }, update, { upsert: true });
  await interaction.reply({
    embeds: [successEmbed(`${role} has been ${op === 'add' ? 'added to' : 'removed from'} ticket staff roles.`)],
    ephemeral: true,
  });
}

async function logChannel(interaction) {
  const channel = interaction.options.getChannel('channel');
  await TicketConfig.updateOne({ guildId: interaction.guild.id }, { logChannelId: channel.id }, { upsert: true });
  await interaction.reply({ embeds: [successEmbed(`Ticket log channel set to ${channel}.`)], ephemeral: true });
}

async function transcriptChannel(interaction) {
  const channel = interaction.options.getChannel('channel');
  await TicketConfig.updateOne({ guildId: interaction.guild.id }, { transcriptChannelId: channel.id }, { upsert: true });
  await interaction.reply({ embeds: [successEmbed(`Transcript channel set to ${channel}.`)], ephemeral: true });
}

async function maxTickets(interaction) {
  const max = interaction.options.getInteger('max');
  await TicketConfig.updateOne({ guildId: interaction.guild.id }, { maxTicketsPerUser: max }, { upsert: true });
  await interaction.reply({ embeds: [successEmbed(`Max open tickets per user set to **${max}**.`)], ephemeral: true });
}

async function showConfig(interaction) {
  const config = await getTicketConfig(interaction.guild.id);
  const cats = (config.categories || DEFAULT_CATEGORIES).map(c => `${c.emoji || '🎫'} **${c.name}** (\`${c.id}\`)`).join('\n');

  const embed = createEmbed({
    color: Colors.PRIMARY,
    title: `${Emojis.TICKET} Ticket Configuration`,
    description: [
      `**Enabled:** ${config.enabled ? 'Yes' : 'No'}`,
      `**Panel Channel:** ${config.panelChannelId ? `<#${config.panelChannelId}>` : 'Not set'}`,
      `**Log Channel:** ${config.logChannelId ? `<#${config.logChannelId}>` : 'Not set'}`,
      `**Transcript Channel:** ${config.transcriptChannelId ? `<#${config.transcriptChannelId}>` : 'Not set'}`,
      `**Max Tickets Per User:** ${config.maxTicketsPerUser || 3}`,
      `**Staff Roles:** ${config.staffRoles?.length ? config.staffRoles.map(r => `<@&${r}>`).join(', ') : 'None'}`,
      '',
      '**Categories:**',
      cats || 'Using defaults',
    ].join('\n'),
    footer: 'Nexora Tickets',
  });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
