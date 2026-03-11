const { PermissionFlagsBits } = require('discord.js');

function hasPermission(member, permission) {
  if (!member) return false;
  return member.permissions.has(permission);
}

function isAdmin(member) {
  if (!member) return false;
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

function isOwner(member) {
  if (!member) return false;
  return member.id === member.guild.ownerId;
}

function hasBypassRole(member, bypassRoles = []) {
  if (!member || !bypassRoles.length) return false;
  return member.roles.cache.some((r) => bypassRoles.includes(r.id));
}

function canModerate(moderator, target) {
  if (!moderator || !target) return false;
  if (target.id === moderator.guild.ownerId) return false;
  if (moderator.id === moderator.guild.ownerId) return true;
  return moderator.roles.highest.position > target.roles.highest.position;
}

function botCanModerate(guild, target) {
  const botMember = guild.members.me;
  if (!botMember || !target) return false;
  if (target.id === guild.ownerId) return false;
  return botMember.roles.highest.position > target.roles.highest.position;
}

module.exports = { hasPermission, isAdmin, isOwner, hasBypassRole, canModerate, botCanModerate };
