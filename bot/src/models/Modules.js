const mongoose = require('mongoose');

const welcomeConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: false },
  channelId: { type: String, default: null },
  message: { type: String, default: 'Welcome to the server, {user}! 🎉' },
  embedEnabled: { type: Boolean, default: true },
  embedColor: { type: Number, default: 0x7C3AED },
  embedTitle: { type: String, default: 'Welcome!' },
  embedImage: { type: String, default: null },
  dmEnabled: { type: Boolean, default: false },
  dmMessage: { type: String, default: '' },
  goodbye: {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    message: { type: String, default: '{user} has left the server.' },
  },
}, { timestamps: true });

const autoroleConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: false },
  roles: [{ type: String }],
  delay: { type: Number, default: 0 },
  botRoles: [{ type: String }],
}, { timestamps: true });

const loggingConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  modLogChannelId: { type: String, default: null },
  securityLogChannelId: { type: String, default: null },
  ticketLogChannelId: { type: String, default: null },
  joinLeaveLogChannelId: { type: String, default: null },
  messageLogChannelId: { type: String, default: null },
  voiceLogChannelId: { type: String, default: null },
}, { timestamps: true });

const verificationConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: false },
  type: { type: String, default: 'button', enum: ['button', 'reaction'] },
  channelId: { type: String, default: null },
  messageId: { type: String, default: null },
  roleId: { type: String, default: null },
  message: { type: String, default: 'Click the button below to verify yourself!' },
}, { timestamps: true });

const levelingConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: false },
  channelId: { type: String, default: null },
  xpPerMessage: { min: { type: Number, default: 15 }, max: { type: Number, default: 25 } },
  xpCooldown: { type: Number, default: 60000 },
  ignoredChannels: [{ type: String }],
  ignoredRoles: [{ type: String }],
  roleRewards: [{
    level: { type: Number, required: true },
    roleId: { type: String, required: true },
  }],
  stackRoles: { type: Boolean, default: false },
}, { timestamps: true });

const userLevelSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  totalMessages: { type: Number, default: 0 },
  lastXpAt: { type: Date, default: null },
}, { timestamps: true });

userLevelSchema.index({ guildId: 1, userId: 1 }, { unique: true });
userLevelSchema.index({ guildId: 1, xp: -1 });

const suggestionConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: false },
  channelId: { type: String, default: null },
  staffChannelId: { type: String, default: null },
  allowAnonymous: { type: Boolean, default: false },
  autoThread: { type: Boolean, default: false },
}, { timestamps: true });

const WelcomeConfig = mongoose.model('WelcomeConfig', welcomeConfigSchema);
const AutoroleConfig = mongoose.model('AutoroleConfig', autoroleConfigSchema);
const LoggingConfig = mongoose.model('LoggingConfig', loggingConfigSchema);
const VerificationConfig = mongoose.model('VerificationConfig', verificationConfigSchema);
const LevelingConfig = mongoose.model('LevelingConfig', levelingConfigSchema);
const UserLevel = mongoose.model('UserLevel', userLevelSchema);
const SuggestionConfig = mongoose.model('SuggestionConfig', suggestionConfigSchema);

module.exports = {
  WelcomeConfig, AutoroleConfig, LoggingConfig,
  VerificationConfig, LevelingConfig, UserLevel, SuggestionConfig,
};
