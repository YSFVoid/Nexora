const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const SecurityConfig = require('../../../models/SecurityConfig');
const { createEmbed, successEmbed, errorEmbed } = require('../../../utils/embeds');
const Colors = require('../../../constants/colors');
const Emojis = require('../../../constants/emojis');

const SECURITY_MODULES = [
  'antiSpam', 'antiRaid', 'antiLink', 'antiInvite',
  'antiMassMention', 'antiCaps', 'antiEmojiSpam', 'antiScam',
  'antiWebhookAbuse', 'suspiciousAccounts',
];

module.exports = {
  name: 'security',
  data: new SlashCommandBuilder()
    .setName('security')
    .setDescription('Manage the security system')
    .addSubcommand(s => s.setName('status').setDescription('View current security configuration'))
    .addSubcommand(s => s
      .setName('toggle')
      .setDescription('Enable or disable a security module')
      .addStringOption(o => o.setName('module').setDescription('Security module').setRequired(true)
        .addChoices(
          { name: 'Anti-Spam', value: 'antiSpam' },
          { name: 'Anti-Raid', value: 'antiRaid' },
          { name: 'Anti-Link', value: 'antiLink' },
          { name: 'Anti-Invite', value: 'antiInvite' },
          { name: 'Anti-Mass Mention', value: 'antiMassMention' },
          { name: 'Anti-Caps', value: 'antiCaps' },
          { name: 'Anti-Emoji Spam', value: 'antiEmojiSpam' },
          { name: 'Anti-Scam', value: 'antiScam' },
          { name: 'Anti-Webhook Abuse', value: 'antiWebhookAbuse' },
          { name: 'Suspicious Accounts', value: 'suspiciousAccounts' },
        ))
      .addBooleanOption(o => o.setName('enabled').setDescription('Enable or disable').setRequired(true)))
    .addSubcommand(s => s
      .setName('action')
      .setDescription('Set punishment action for a security module')
      .addStringOption(o => o.setName('module').setDescription('Security module').setRequired(true)
        .addChoices(
          { name: 'Anti-Spam', value: 'antiSpam' },
          { name: 'Anti-Raid', value: 'antiRaid' },
          { name: 'Anti-Link', value: 'antiLink' },
          { name: 'Anti-Invite', value: 'antiInvite' },
          { name: 'Anti-Mass Mention', value: 'antiMassMention' },
          { name: 'Anti-Caps', value: 'antiCaps' },
          { name: 'Anti-Emoji Spam', value: 'antiEmojiSpam' },
          { name: 'Anti-Scam', value: 'antiScam' },
        ))
      .addStringOption(o => o.setName('action').setDescription('Punishment action').setRequired(true)
        .addChoices(
          { name: 'Delete', value: 'delete' },
          { name: 'Warn', value: 'warn' },
          { name: 'Timeout', value: 'timeout' },
          { name: 'Kick', value: 'kick' },
          { name: 'Ban', value: 'ban' },
        )))
    .addSubcommand(s => s
      .setName('bypass-role')
      .setDescription('Add or remove a bypass role')
      .addRoleOption(o => o.setName('role').setDescription('Role to bypass').setRequired(true))
      .addStringOption(o => o.setName('operation').setDescription('Add or remove').setRequired(true)
        .addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' })))
    .addSubcommand(s => s
      .setName('bypass-channel')
      .setDescription('Add or remove a bypass channel')
      .addChannelOption(o => o.setName('channel').setDescription('Channel to bypass').setRequired(true))
      .addStringOption(o => o.setName('operation').setDescription('Add or remove').setRequired(true)
        .addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' })))
    .addSubcommand(s => s
      .setName('log-channel')
      .setDescription('Set the security log channel')
      .addChannelOption(o => o.setName('channel').setDescription('Log channel').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  permissions: [PermissionFlagsBits.Administrator],
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    let config = await SecurityConfig.findOne({ guildId });
    if (!config) config = await SecurityConfig.create({ guildId });

    switch (sub) {
      case 'status': return showStatus(interaction, config);
      case 'toggle': return toggleModule(interaction, config);
      case 'action': return setAction(interaction, config);
      case 'bypass-role': return manageBypassRole(interaction, config);
      case 'bypass-channel': return manageBypassChannel(interaction, config);
      case 'log-channel': return setLogChannel(interaction, config);
    }
  },
};

async function showStatus(interaction, config) {
  const statusLine = (mod, label) => {
    const data = config[mod];
    if (!data) return `${Emojis.ERROR} **${label}** — Not configured`;
    const status = data.enabled ? `${Emojis.SUCCESS} Enabled` : `${Emojis.ERROR} Disabled`;
    const action = data.action ? ` • Action: \`${data.action}\`` : '';
    return `${status} **${label}**${action}`;
  };

  const embed = createEmbed({
    color: Colors.PRIMARY,
    title: `${Emojis.SECURITY} Security Configuration`,
    description: [
      statusLine('antiSpam', 'Anti-Spam'),
      statusLine('antiRaid', 'Anti-Raid'),
      statusLine('antiLink', 'Anti-Link'),
      statusLine('antiInvite', 'Anti-Invite'),
      statusLine('antiMassMention', 'Anti-Mass Mention'),
      statusLine('antiCaps', 'Anti-Caps'),
      statusLine('antiEmojiSpam', 'Anti-Emoji Spam'),
      statusLine('antiScam', 'Anti-Scam'),
      statusLine('antiWebhookAbuse', 'Anti-Webhook Abuse'),
      statusLine('suspiciousAccounts', 'Suspicious Accounts'),
      '',
      `**Log Channel:** ${config.logChannelId ? `<#${config.logChannelId}>` : 'Not set'}`,
      `**Bypass Roles:** ${config.bypassRoles?.length ? config.bypassRoles.map(r => `<@&${r}>`).join(', ') : 'None'}`,
      `**Bypass Channels:** ${config.bypassChannels?.length ? config.bypassChannels.map(c => `<#${c}>`).join(', ') : 'None'}`,
    ].join('\n'),
    footer: 'Nexora Security',
  });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function toggleModule(interaction, config) {
  const mod = interaction.options.getString('module');
  const enabled = interaction.options.getBoolean('enabled');

  await SecurityConfig.updateOne(
    { guildId: interaction.guild.id },
    { $set: { [`${mod}.enabled`]: enabled } }
  );

  const label = mod.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
  await interaction.reply({
    embeds: [successEmbed(`**${label}** has been ${enabled ? 'enabled' : 'disabled'}.`)],
    ephemeral: true,
  });
}

async function setAction(interaction, config) {
  const mod = interaction.options.getString('module');
  const action = interaction.options.getString('action');

  await SecurityConfig.updateOne(
    { guildId: interaction.guild.id },
    { $set: { [`${mod}.action`]: action } }
  );

  const label = mod.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
  await interaction.reply({
    embeds: [successEmbed(`**${label}** action set to \`${action}\`.`)],
    ephemeral: true,
  });
}

async function manageBypassRole(interaction, config) {
  const role = interaction.options.getRole('role');
  const op = interaction.options.getString('operation');

  const update = op === 'add'
    ? { $addToSet: { bypassRoles: role.id } }
    : { $pull: { bypassRoles: role.id } };

  await SecurityConfig.updateOne({ guildId: interaction.guild.id }, update);
  await interaction.reply({
    embeds: [successEmbed(`${role} has been ${op === 'add' ? 'added to' : 'removed from'} security bypass roles.`)],
    ephemeral: true,
  });
}

async function manageBypassChannel(interaction, config) {
  const channel = interaction.options.getChannel('channel');
  const op = interaction.options.getString('operation');

  const update = op === 'add'
    ? { $addToSet: { bypassChannels: channel.id } }
    : { $pull: { bypassChannels: channel.id } };

  await SecurityConfig.updateOne({ guildId: interaction.guild.id }, update);
  await interaction.reply({
    embeds: [successEmbed(`${channel} has been ${op === 'add' ? 'added to' : 'removed from'} security bypass channels.`)],
    ephemeral: true,
  });
}

async function setLogChannel(interaction, config) {
  const channel = interaction.options.getChannel('channel');
  await SecurityConfig.updateOne({ guildId: interaction.guild.id }, { logChannelId: channel.id });
  await interaction.reply({
    embeds: [successEmbed(`Security log channel set to ${channel}.`)],
    ephemeral: true,
  });
}
