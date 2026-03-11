const SecurityConfig = require('../../models/SecurityConfig');
const ModerationCase = require('../../models/ModerationCase');
const { getGuildConfig } = require('../../services/configService');
const { createEmbed, warningEmbed } = require('../../utils/embeds');
const { hasBypassRole, isAdmin, isOwner } = require('../../utils/permissions');
const Colors = require('../../constants/colors');
const Emojis = require('../../constants/emojis');
const logger = require('../../utils/logger');

const messageHistory = new Map();
const joinHistory = new Map();
const securityConfigCache = new Map();

const SCAM_PATTERNS = [
  /free\s*nitro/i,
  /steam\s*gift/i,
  /claim\s*your?\s*prize/i,
  /discord\.gift/i,
  /discordapp\.gift/i,
  /you\s+won\s+a?\s*subscription/i,
  /click\s+here\s+to\s+claim/i,
  /airdrop/i,
  /@everyone.*http/i,
  /crypto.*giveaway/i,
];

const INVITE_REGEX = /(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9]+/gi;
const URL_REGEX = /https?:\/\/[^\s<]+/gi;

async function getSecurityConfig(guildId) {
  const cached = securityConfigCache.get(guildId);
  if (cached && Date.now() - cached._cachedAt < 300000) return cached;

  let config = await SecurityConfig.findOne({ guildId });
  if (!config) {
    config = await SecurityConfig.create({ guildId });
  }
  const obj = config.toObject();
  obj._cachedAt = Date.now();
  securityConfigCache.set(guildId, obj);
  return obj;
}

async function processMessage(message) {
  if (!message.guild || message.author.bot) return false;

  const guildConfig = await getGuildConfig(message.guild.id);
  if (!guildConfig.modules?.security) return false;

  const config = await getSecurityConfig(message.guild.id);
  const member = message.member;

  if (isOwner(member) || isAdmin(member)) return false;
  if (hasBypassRole(member, config.bypassRoles || [])) return false;
  if ((config.bypassChannels || []).includes(message.channel.id)) return false;
  if ((config.bypassUsers || []).includes(message.author.id)) return false;

  let riskScore = 0;
  const violations = [];

  if (config.antiScam?.enabled) {
    const isScam = SCAM_PATTERNS.some((p) => p.test(message.content));
    if (isScam) {
      riskScore += 80;
      violations.push({ type: 'scam', action: config.antiScam.action });
    }
  }

  if (config.antiInvite?.enabled) {
    if (INVITE_REGEX.test(message.content)) {
      riskScore += 40;
      violations.push({ type: 'invite', action: config.antiInvite.action });
    }
  }

  if (config.antiLink?.enabled) {
    const urls = message.content.match(URL_REGEX) || [];
    if (urls.length > 0) {
      const whitelisted = config.antiLink.whitelistedDomains || [];
      const hasBlockedLink = urls.some((url) => {
        try {
          const domain = new URL(url).hostname;
          return !whitelisted.some((w) => domain.endsWith(w));
        } catch { return true; }
      });

      if (hasBlockedLink && !(config.antiLink.allowImages && isImageUrl(urls))) {
        riskScore += 30;
        violations.push({ type: 'link', action: config.antiLink.action });
      }
    }
  }

  if (config.antiMassMention?.enabled) {
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    if (mentionCount >= (config.antiMassMention.mentionLimit || 8)) {
      riskScore += 50;
      violations.push({ type: 'mention', action: config.antiMassMention.action, count: mentionCount });
    }
  }

  if (config.antiSpam?.enabled) {
    const spamResult = checkSpam(message, config.antiSpam);
    if (spamResult) {
      riskScore += 35;
      violations.push({ type: 'spam', action: config.antiSpam.action, ...spamResult });
    }
  }

  if (config.antiCaps?.enabled) {
    const text = message.content.replace(/[^a-zA-Z]/g, '');
    if (text.length >= (config.antiCaps.minLength || 10)) {
      const capsRatio = (text.replace(/[^A-Z]/g, '').length) / text.length;
      if (capsRatio >= (config.antiCaps.threshold || 0.7)) {
        riskScore += 15;
        violations.push({ type: 'caps', action: config.antiCaps.action });
      }
    }
  }

  if (config.antiEmojiSpam?.enabled) {
    const emojiCount = (message.content.match(/<a?:\w+:\d+>|[\u{1F000}-\u{1FFFF}]/gu) || []).length;
    if (emojiCount >= (config.antiEmojiSpam.emojiLimit || 10)) {
      riskScore += 15;
      violations.push({ type: 'emoji', action: config.antiEmojiSpam.action });
    }
  }

  if (violations.length === 0) {
    trackMessage(message);
    return false;
  }

  const severityOrder = { delete: 0, warn: 1, timeout: 2, kick: 3, ban: 4, quarantine: 5 };
  violations.sort((a, b) => (severityOrder[b.action] || 0) - (severityOrder[a.action] || 0));
  const primaryViolation = violations[0];

  await executeAction(message, primaryViolation, riskScore, config);
  return true;
}

function checkSpam(message, spamConfig) {
  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();
  const window = spamConfig.timeWindow || 5000;
  const limit = spamConfig.messageLimit || 5;

  if (!messageHistory.has(key)) messageHistory.set(key, []);
  const history = messageHistory.get(key);

  history.push({ content: message.content, timestamp: now });

  while (history.length > 0 && now - history[0].timestamp > window) {
    history.shift();
  }

  if (history.length >= limit) {
    messageHistory.delete(key);
    return { count: history.length, window: window / 1000 };
  }

  const recentDupes = history.filter((m) => m.content === message.content);
  if (recentDupes.length >= 3) {
    return { count: recentDupes.length, window: window / 1000, duplicate: true };
  }

  return null;
}

function trackMessage(message) {
  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();

  if (!messageHistory.has(key)) messageHistory.set(key, []);
  const history = messageHistory.get(key);
  history.push({ content: message.content, timestamp: now });

  while (history.length > 0 && now - history[0].timestamp > 30000) {
    history.shift();
  }
  if (history.length > 20) history.splice(0, history.length - 20);
}

async function executeAction(message, violation, riskScore, config) {
  const { type, action } = violation;

  try { await message.delete(); } catch { }

  const member = message.member;
  const reason = `[Nexora Security] ${type} violation (risk: ${riskScore})`;

  switch (action) {
    case 'delete':
      break;

    case 'warn': {
      await createCase(message.guild.id, member.id, message.client.user.id, 'warn', reason, true);
      try {
        await message.channel.send({
          embeds: [warningEmbed(`${member}, your message was removed for **${type}** violation.`)],
        }).then((m) => setTimeout(() => m.delete().catch(() => {}), 8000));
      } catch { }
      break;
    }

    case 'timeout': {
      const duration = config.antiSpam?.timeoutDuration || 300000;
      try { await member.timeout(duration, reason); } catch (err) {
        logger.warn('Security', `Cannot timeout ${member.user.tag}: ${err.message}`);
      }
      await createCase(message.guild.id, member.id, message.client.user.id, 'timeout', reason, true, duration);
      break;
    }

    case 'kick': {
      await createCase(message.guild.id, member.id, message.client.user.id, 'kick', reason, true);
      try { await member.kick(reason); } catch (err) {
        logger.warn('Security', `Cannot kick ${member.user.tag}: ${err.message}`);
      }
      break;
    }

    case 'ban': {
      await createCase(message.guild.id, member.id, message.client.user.id, 'ban', reason, true);
      try { await member.ban({ reason, deleteMessageSeconds: 86400 }); } catch (err) {
        logger.warn('Security', `Cannot ban ${member.user.tag}: ${err.message}`);
      }
      break;
    }

    case 'quarantine': {
      if (config.quarantineRoleId) {
        try { await member.roles.set([config.quarantineRoleId], reason); } catch (err) {
          logger.warn('Security', `Cannot quarantine ${member.user.tag}: ${err.message}`);
        }
      } else {
        try { await member.timeout(600000, reason); } catch { }
      }
      break;
    }
  }

  await logSecurityEvent(message.guild, config, type, action, member, riskScore);
}

async function createCase(guildId, userId, moderatorId, actionType, reason, automated = false, duration = null) {
  try {
    const lastCase = await ModerationCase.findOne({ guildId }).sort({ caseNumber: -1 });
    const caseNumber = (lastCase?.caseNumber || 0) + 1;

    await ModerationCase.create({
      guildId, caseNumber, userId, moderatorId,
      action: actionType, reason, automated, duration,
    });
  } catch (err) {
    logger.error('Security', `Failed to create mod case: ${err.message}`);
  }
}

async function logSecurityEvent(guild, config, type, action, member, riskScore) {
  const channelId = config.logChannelId;
  if (!channelId) return;

  try {
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    const embed = createEmbed({
      color: riskScore >= 50 ? Colors.DANGER : Colors.WARNING,
      title: `${Emojis.SECURITY} Security Alert`,
      fields: [
        { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
        { name: 'Violation', value: type, inline: true },
        { name: 'Action', value: action, inline: true },
        { name: 'Risk Score', value: `${riskScore}/100`, inline: true },
      ],
      footer: 'Nexora Security',
    });

    await channel.send({ embeds: [embed] });
  } catch (err) {
    logger.error('Security', `Failed to log security event: ${err.message}`);
  }
}

async function processJoin(member) {
  if (member.user.bot) return;

  const guildConfig = await getGuildConfig(member.guild.id);
  if (!guildConfig.modules?.security) return;

  const config = await getSecurityConfig(member.guild.id);

  if (config.antiRaid?.enabled) {
    const guildId = member.guild.id;
    const now = Date.now();
    const window = config.antiRaid.joinWindow || 10000;
    const limit = config.antiRaid.joinLimit || 10;

    if (!joinHistory.has(guildId)) joinHistory.set(guildId, []);
    const joins = joinHistory.get(guildId);
    joins.push({ userId: member.id, timestamp: now });

    while (joins.length > 0 && now - joins[0].timestamp > window) {
      joins.shift();
    }

    if (joins.length >= limit) {
      logger.warn('Security', `Raid detected in ${member.guild.name}: ${joins.length} joins in ${window / 1000}s`);
      await handleRaid(member.guild, config, joins);
      joinHistory.delete(guildId);
    }
  }

  if (config.suspiciousAccounts?.enabled) {
    const accountAge = Date.now() - member.user.createdTimestamp;
    const minAge = (config.suspiciousAccounts.minAccountAge || 7) * 86400000;

    if (accountAge < minAge) {
      logger.info('Security', `Suspicious account: ${member.user.tag} (${Math.floor(accountAge / 86400000)} days old)`);

      if (config.suspiciousAccounts.action === 'kick') {
        try { await member.kick('[Nexora] Account too new'); } catch { }
      } else if (config.quarantineRoleId) {
        try { await member.roles.add(config.quarantineRoleId, '[Nexora] New account quarantine'); } catch { }
      }
    }
  }
}

async function handleRaid(guild, config, joins) {
  const action = config.antiRaid.action || 'kick';

  for (const join of joins) {
    try {
      const member = await guild.members.fetch(join.userId).catch(() => null);
      if (!member) continue;
      if (isAdmin(member) || isOwner(member)) continue;

      switch (action) {
        case 'kick':
          await member.kick('[Nexora] Anti-raid').catch(() => {});
          break;
        case 'ban':
          await member.ban({ reason: '[Nexora] Anti-raid', deleteMessageSeconds: 3600 }).catch(() => {});
          break;
        case 'quarantine':
          if (config.quarantineRoleId) {
            await member.roles.set([config.quarantineRoleId], '[Nexora] Anti-raid quarantine').catch(() => {});
          }
          break;
      }

      await createCase(guild.id, member.id, guild.client.user.id, action === 'quarantine' ? 'timeout' : action, '[Nexora] Anti-raid', true);
    } catch { }
  }

  await logSecurityEvent(guild, config, 'raid', action, { user: { tag: 'multiple', id: 'raid' }, id: 'raid' }, 90);
}

function isImageUrl(urls) {
  return urls.every((u) => /\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i.test(u));
}

function invalidateSecurityCache(guildId) {
  securityConfigCache.delete(guildId);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, history] of messageHistory) {
    while (history.length > 0 && now - history[0].timestamp > 60000) history.shift();
    if (history.length === 0) messageHistory.delete(key);
  }
  for (const [key, joins] of joinHistory) {
    while (joins.length > 0 && now - joins[0].timestamp > 60000) joins.shift();
    if (joins.length === 0) joinHistory.delete(key);
  }
}, 60000);

module.exports = { processMessage, processJoin, getSecurityConfig, invalidateSecurityCache, createCase };
