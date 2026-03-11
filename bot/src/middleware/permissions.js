const { Collection } = require('discord.js');
const { isAdmin, isOwner, hasPermission } = require('../utils/permissions');
const Limits = require('../constants/limits');

function checkPermissions(member, command) {
  if (!command.permissions) return null;
  if (isOwner(member)) return null;

  if (command.adminOnly && !isAdmin(member)) {
    return 'You need **Administrator** permission to use this command.';
  }

  for (const perm of command.permissions) {
    if (!hasPermission(member, perm)) {
      return `You need the **${perm}** permission to use this command.`;
    }
  }

  return null;
}

function checkCooldown(cooldowns, userId, commandName, cooldownMs) {
  const cd = cooldownMs || Limits.DEFAULT_COMMAND_COOLDOWN;
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Collection());
  }

  const timestamps = cooldowns.get(commandName);
  const now = Date.now();

  if (timestamps.has(userId)) {
    const expiresAt = timestamps.get(userId) + cd;
    if (now < expiresAt) {
      return expiresAt - now;
    }
  }

  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cd);
  return 0;
}

module.exports = { checkPermissions, checkCooldown };
