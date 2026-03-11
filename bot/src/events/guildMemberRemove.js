module.exports = {
  name: 'guildMemberRemove',
  async execute(client, member) {
    try {
      const welcomeService = require('../modules/welcome/welcomeService');
      await welcomeService.sendGoodbye(member);
    } catch { }
  },
};
