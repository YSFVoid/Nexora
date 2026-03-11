module.exports = {
  name: 'voiceStateUpdate',
  async execute(client, oldState, newState) {
    try {
      const { handleVoiceStateUpdate } = require('../modules/tempvoice/tempVoiceService');
      await handleVoiceStateUpdate(oldState, newState);
    } catch { }
  },
};
