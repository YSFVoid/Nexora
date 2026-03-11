const { AutoroleConfig } = require('../../models/Modules');
const { getGuildConfig } = require('../../services/configService');
const logger = require('../../utils/logger');

async function assignRoles(member) {
  const guildConfig = await getGuildConfig(member.guild.id);
  if (!guildConfig.modules?.autorole) return;

  const config = await AutoroleConfig.findOne({ guildId: member.guild.id });
  if (!config?.enabled || !config.roles?.length) return;

  const rolesToAssign = member.user.bot ? (config.botRoles || []) : config.roles;
  if (!rolesToAssign.length) return;

  const delay = config.delay || 0;

  const assign = async () => {
    try {
      for (const roleId of rolesToAssign) {
        const role = member.guild.roles.cache.get(roleId);
        if (role && member.guild.members.me.roles.highest.position > role.position) {
          await member.roles.add(role, '[Nexora] Autorole').catch(() => {});
        }
      }
    } catch (err) {
      logger.error('Autorole', `Failed to assign roles in ${member.guild.name}: ${err.message}`);
    }
  };

  if (delay > 0) {
    setTimeout(assign, delay);
  } else {
    await assign();
  }
}

module.exports = { assignRoles };
