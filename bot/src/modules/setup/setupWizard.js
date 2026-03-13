const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
  PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const SecurityConfig = require('../../models/SecurityConfig');
const { createEmbed, successEmbed } = require('../../utils/embeds');
const { updateGuildConfig } = require('../../services/configService');
const Colors = require('../../constants/colors');
const Emojis = require('../../constants/emojis');

const SERVER_TYPES = [
  { value: 'community', label: '🌐 Community Server', description: 'General community with discussions and events' },
  { value: 'gaming', label: '🎮 Gaming Server', description: 'Gaming community with voice and matchmaking' },
  { value: 'shop', label: '🛒 Shop / Business', description: 'Business or marketplace server' },
  { value: 'creator', label: '🎨 Creator Server', description: 'Content creator or artist community' },
  { value: 'support', label: '🎧 Support / Helpdesk', description: 'Customer support and ticket-focused' },
  { value: 'custom', label: '⚙️ Custom Setup', description: 'Configure everything manually' },
];

const SECURITY_LEVELS = [
  { value: 'low', label: '🟢 Low', description: 'Basic protection — anti-scam and anti-raid only' },
  { value: 'medium', label: '🟡 Medium (Recommended)', description: 'Balanced protection for most servers' },
  { value: 'high', label: '🔴 High', description: 'Maximum protection — all filters enabled' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: '🇬🇧 English', description: 'English' },
  { value: 'fr', label: '🇫🇷 Français', description: 'French' },
  { value: 'ar', label: '🇸🇦 العربية', description: 'Arabic' },
  { value: 'es', label: '🇪🇸 Español', description: 'Spanish' },
  { value: 'pt', label: '🇧🇷 Português', description: 'Portuguese' },
  { value: 'de', label: '🇩🇪 Deutsch', description: 'German' },
];

const PRESETS = {
  community: {
    security: 'medium',
    modules: { security: true, moderation: true, welcome: true, autorole: true, leveling: true, suggestions: true, logging: true, tempvoice: true, tickets: false },
    description: 'Security + leveling + welcome + suggestions enabled',
  },
  gaming: {
    security: 'medium',
    modules: { security: true, moderation: true, tempvoice: true, welcome: true, leveling: true, logging: true, tickets: false, suggestions: false },
    description: 'Temp voice + leveling + welcome enabled',
  },
  shop: {
    security: 'high',
    modules: { security: true, moderation: true, tickets: true, welcome: true, logging: true, tempvoice: false, leveling: false },
    description: 'Tickets + high security + welcome enabled',
  },
  creator: {
    security: 'medium',
    modules: { security: true, moderation: true, welcome: true, suggestions: true, leveling: true, logging: true, tempvoice: true, tickets: false },
    description: 'Suggestions + leveling + temp voice enabled',
  },
  support: {
    security: 'medium',
    modules: { security: true, moderation: true, tickets: true, logging: true, welcome: true, tempvoice: false, leveling: false, suggestions: false },
    description: 'Tickets + logging + welcome prioritized',
  },
  custom: {
    security: 'medium',
    modules: { security: true, moderation: true },
    description: 'Only basics — you configure the rest',
  },
};

async function startSetup(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const embed = createEmbed({
    color: Colors.PRIMARY,
    title: `${Emojis.SETTINGS} Nexora Setup Wizard`,
    description: [
      'Welcome to the **Nexora Setup Wizard**! 🎉',
      '',
      "Let's configure your server for the best experience.",
      'First, select your **server type** to get smart recommended settings.',
      '',
      '*You can change any setting later with individual module commands.*',
    ].join('\n'),
    footer: 'Step 1/3 • Server Type',
  });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('setup:servertype')
    .setPlaceholder('Select your server type...')
    .addOptions(SERVER_TYPES.map(t => ({ label: t.label, value: t.value, description: t.description })));

  await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)] });
}

async function handleSelectMenu(interaction, action) {
  if (action === 'servertype') return handleServerTypeSelect(interaction);
  if (action === 'security') return handleSecuritySelect(interaction);
  if (action === 'language') return handleLanguageSelect(interaction);
}

async function handleServerTypeSelect(interaction) {
  const serverType = interaction.values[0];
  const preset = PRESETS[serverType] || PRESETS.custom;

  await interaction.deferUpdate();
  await updateGuildConfig(interaction.guild.id, { serverType, modules: { ...preset.modules } });

  const embed = createEmbed({
    color: Colors.PRIMARY,
    title: `${Emojis.SHIELD} Security Configuration`,
    description: [
      `**Server Type:** ${SERVER_TYPES.find(t => t.value === serverType)?.label || serverType}`,
      `**Applied:** ${preset.description}`,
      '',
      'Now choose your **security level**:',
      '',
      '🟢 **Low** — Anti-scam and anti-raid only. Best for trusted, small servers.',
      '🟡 **Medium** — Balanced protection. Recommended for most servers.',
      '🔴 **High** — All filters active. Ideal for public or large servers.',
    ].join('\n'),
    footer: 'Step 2/3 • Security Level',
  });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('setup:security')
    .setPlaceholder('Choose security level...')
    .addOptions(SECURITY_LEVELS.map(s => ({ label: s.label, value: s.value, description: s.description })));

  await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)] });
}

async function handleSecuritySelect(interaction) {
  const level = interaction.values[0];
  await interaction.deferUpdate();

  const securitySettings = getSecurityPreset(level);
  await SecurityConfig.findOneAndUpdate(
    { guildId: interaction.guild.id },
    { $set: securitySettings },
    { upsert: true, new: true }
  );

  const embed = createEmbed({
    color: Colors.PRIMARY,
    title: '🌐 Language Selection',
    description: [
      `**Security Level:** ${level.charAt(0).toUpperCase() + level.slice(1)}`,
      '',
      'Choose your **default language** for Nexora responses:',
    ].join('\n'),
    footer: 'Step 3/3 • Language',
  });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('setup:language')
    .setPlaceholder('Select language...')
    .addOptions(LANGUAGE_OPTIONS.map(l => ({ label: l.label, value: l.value, description: l.description })));

  await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)] });
}

async function handleLanguageSelect(interaction) {
  const language = interaction.values[0];
  await interaction.deferUpdate();

  await updateGuildConfig(interaction.guild.id, { language });

  const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });

  const enabledModules = Object.entries(guildConfig?.modules || {})
    .filter(([, v]) => v)
    .map(([k]) => `✅ ${k.charAt(0).toUpperCase() + k.slice(1)}`)
    .join('\n');

  const embed = createEmbed({
    color: Colors.SUCCESS,
    title: `${Emojis.SUCCESS} Setup Complete!`,
    description: [
      '**Your Nexora configuration:**', '',
      `**Server Type:** ${guildConfig?.serverType || 'Custom'}`,
      `**Language:** ${LANGUAGE_OPTIONS.find(l => l.value === language)?.label || language}`, '',
      '**Enabled Modules:**', enabledModules || 'None', '',
      '**Recommended Next Steps:**',
      guildConfig?.modules?.tempvoice ? '• `/tempvoice setup` — Set up temporary voice channels' : '',
      guildConfig?.modules?.tickets ? '• `/ticket setup` — Deploy the ticket panel' : '',
      guildConfig?.modules?.welcome ? '• `/welcome set` — Configure welcome messages' : '',
      guildConfig?.modules?.autorole ? '• `/autorole add` — Add auto-assigned roles' : '',
      guildConfig?.modules?.leveling ? '• `/leveling enable` — Configure leveling' : '',
      guildConfig?.modules?.verification ? '• `/verification setup` — Set up member verification' : '',
      '• `/security status` — Review security settings',
      '• `/logging set` — Configure log channels',
    ].filter(Boolean).join('\n'),
    footer: 'Setup Complete • Nexora',
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('setup:finish').setLabel('✨ Finish Setup').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('setup:restart').setLabel('🔄 Restart').setStyle(ButtonStyle.Secondary),
  );

  await interaction.editReply({ embeds: [embed], components: [row] });
}

async function handleButton(interaction, action) {
  if (action === 'finish') {
    await updateGuildConfig(interaction.guild.id, { setupCompleted: true });
    const embed = createEmbed({
      color: Colors.SUCCESS,
      title: '🎉 Nexora is Ready!',
      description: 'Your server is now configured and protected by Nexora.\n\nUse `/help` to explore all available commands.',
    });
    await interaction.update({ embeds: [embed], components: [] });
  }

  if (action === 'restart') {
    await startSetup(interaction);
  }
}

function getSecurityPreset(level) {
  switch (level) {
    case 'low':
      return {
        antiSpam: { enabled: false }, antiRaid: { enabled: true, joinLimit: 15, joinWindow: 10000, action: 'kick' },
        antiLink: { enabled: false }, antiInvite: { enabled: false }, antiMassMention: { enabled: false },
        antiCaps: { enabled: false }, antiEmojiSpam: { enabled: false },
        antiScam: { enabled: true, action: 'ban' }, antiWebhookAbuse: { enabled: true },
      };
    case 'high':
      return {
        antiSpam: { enabled: true, messageLimit: 4, timeWindow: 5000, action: 'timeout', timeoutDuration: 600000 },
        antiRaid: { enabled: true, joinLimit: 8, joinWindow: 10000, action: 'ban' },
        antiLink: { enabled: true, action: 'warn' }, antiInvite: { enabled: true, action: 'timeout' },
        antiMassMention: { enabled: true, mentionLimit: 5, action: 'timeout' },
        antiCaps: { enabled: true, threshold: 0.7, minLength: 10, action: 'delete' },
        antiEmojiSpam: { enabled: true, emojiLimit: 8, action: 'delete' },
        antiScam: { enabled: true, action: 'ban' }, antiWebhookAbuse: { enabled: true },
        suspiciousAccounts: { enabled: true, minAccountAge: 7, action: 'quarantine' },
      };
    default:
      return {
        antiSpam: { enabled: true, messageLimit: 5, timeWindow: 5000, action: 'timeout', timeoutDuration: 300000 },
        antiRaid: { enabled: true, joinLimit: 10, joinWindow: 10000, action: 'kick' },
        antiLink: { enabled: false }, antiInvite: { enabled: true, action: 'warn' },
        antiMassMention: { enabled: true, mentionLimit: 8, action: 'timeout' },
        antiCaps: { enabled: false }, antiEmojiSpam: { enabled: false },
        antiScam: { enabled: true, action: 'ban' }, antiWebhookAbuse: { enabled: true },
      };
  }
}

module.exports = { startSetup, handleSelectMenu, handleButton };
