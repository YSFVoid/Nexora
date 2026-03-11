const { mongoose } = require('mongoose');

const tempVoiceConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  creatorChannelId: { type: String, default: null },
  categoryId: { type: String, default: null },
  controlPanelChannelId: { type: String, default: null },
  controlPanelMessageId: { type: String, default: null },
  defaultUserLimit: { type: Number, default: 0 },
  defaultNameTemplate: { type: String, default: '{user}\'s Room' },
  allowRename: { type: Boolean, default: true },
  allowLimit: { type: Boolean, default: true },
  allowLock: { type: Boolean, default: true },
  allowHide: { type: Boolean, default: true },
  allowBitrate: { type: Boolean, default: false },
  autoDeleteEmpty: { type: Boolean, default: true },
  autoDeleteDelay: { type: Number, default: 0 },
}, { timestamps: true });

const tempVoiceRoomSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, required: true, unique: true, index: true },
  ownerId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  locked: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false },
  userLimit: { type: Number, default: 0 },
  permitted: [{ type: String }],
  denied: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

tempVoiceRoomSchema.index({ guildId: 1, ownerId: 1 });

const TempVoiceConfig = mongoose.model('TempVoiceConfig', tempVoiceConfigSchema);
const TempVoiceRoom = mongoose.model('TempVoiceRoom', tempVoiceRoomSchema);

module.exports = { TempVoiceConfig, TempVoiceRoom };
