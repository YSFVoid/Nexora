const { processJoin } = require('../modules/security/securityService');
const logger = require('../utils/logger');

module.exports = {
  name: 'guildMemberAdd',
  async execute(client, member) {
    try {
      await processJoin(member);
    } catch (err) {
      logger.error('MemberAdd', `Security check error: ${err.message}`);
    }

    try {
      const welcomeService = require('../modules/welcome/welcomeService');
      await welcomeService.sendWelcome(member);
    } catch { }

    try {
      const autoroleService = require('../modules/autorole/autoroleService');
      await autoroleService.assignRoles(member);
    } catch { }
  },
};
