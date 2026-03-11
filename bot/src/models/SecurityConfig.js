const { mongoose } = require('mongoose');

const securityConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },

  antiSpam: {
    enabled: { type: Boolean, default: true },
    messageLimit: { type: Number, default: 5 },
    timeWindow: { type: Number, default: 5000 },
    action: { type: String, default: 'timeout', enum: ['warn', 'timeout', 'kick', 'ban'] },
    timeoutDuration: { type: Number, default: 300000 },
  },

  antiRaid: {
    enabled: { type: Boolean, default: true },
    joinLimit: { type: Number, default: 10 },
    joinWindow: { type: Number, default: 10000 },
    action: { type: String, default: 'kick', enum: ['kick', 'ban', 'quarantine'] },
    lockdown: { type: Boolean, default: false },
  },

  antiLink: {
    enabled: { type: Boolean, default: false },
    whitelistedDomains: [{ type: String }],
    action: { type: String, default: 'warn', enum: ['delete', 'warn', 'timeout', 'kick'] },
    allowImages: { type: Boolean, default: true },
  },

  antiInvite: {
    enabled: { type: Boolean, default: true },
    action: { type: String, default: 'warn', enum: ['delete', 'warn', 'timeout', 'kick'] },
  },

  antiMassMention: {
    enabled: { type: Boolean, default: true },
    mentionLimit: { type: Number, default: 8 },
    action: { type: String, default: 'timeout', enum: ['warn', 'timeout', 'kick', 'ban'] },
  },

  antiCaps: {
    enabled: { type: Boolean, default: false },
    threshold: { type: Number, default: 0.7 },
    minLength: { type: Number, default: 10 },
    action: { type: String, default: 'delete', enum: ['delete', 'warn'] },
  },

  antiEmojiSpam: {
    enabled: { type: Boolean, default: false },
    emojiLimit: { type: Number, default: 10 },
    action: { type: String, default: 'delete', enum: ['delete', 'warn'] },
  },

  antiScam: {
    enabled: { type: Boolean, default: true },
    action: { type: String, default: 'ban', enum: ['warn', 'timeout', 'kick', 'ban'] },
  },

  antiWebhookAbuse: {
    enabled: { type: Boolean, default: true },
    action: { type: String, default: 'delete', enum: ['delete', 'warn'] },
  },

  suspiciousAccounts: {
    enabled: { type: Boolean, default: false },
    minAccountAge: { type: Number, default: 7 },
    action: { type: String, default: 'quarantine', enum: ['quarantine', 'kick'] },
  },

  bypassRoles: [{ type: String }],
  bypassChannels: [{ type: String }],
  bypassUsers: [{ type: String }],
  quarantineRoleId: { type: String, default: null },
  logChannelId: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('SecurityConfig', securityConfigSchema);
