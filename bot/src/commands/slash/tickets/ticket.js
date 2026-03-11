const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { TicketConfig } = require('../../../models/Ticket');
const { deployPanel, getTicketConfig } = require('../../../modules/tickets/ticketService');
const { successEmbed, errorEmbed } = require('../../../utils/embeds');
const { updateGuildConfig } = require('../../../services/configService');

module.exports = {
  name: 'ticket',
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket system management')
    .addSubcommand((s) => s.setName('setup').setDescription('Set up the ticket system in the current channel'))
    .addSubcommand((s) => s.setName('panel').setDescription('Deploy the ticket panel to the current channel'))
    .addSubcommand((s) => s.setName('close').setDescription('Close the current ticket'))
    .addSubcommand((s) => s.setName('add').setDescription('Add a member to the current ticket')
      .addUserOption((o) => o.setName('user').setDescription('User to add').setRequired(true)))
    .addSubcommand((s) => s.setName('remove').setDescription('Remove a member from the current ticket')
      .addUserOption((o) => o.setName('user').setDescription('User to remove').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') return ticketSetup(interaction);
    if (sub === 'panel') return ticketPanel(interaction);
    if (sub === 'close') return ticketClose(interaction);
    if (sub === 'add') return ticketAddMember(interaction);
    if (sub === 'remove') return ticketRemoveMember(interaction);
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
