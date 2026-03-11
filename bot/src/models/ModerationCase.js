const mongoose = require('mongoose');

const moderationCaseSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  caseNumber: { type: Number, required: true },
  userId: { type: String, required: true, index: true },
  moderatorId: { type: String, required: true },
  action: {
    type: String, required: true,
    enum: ['warn', 'timeout', 'untimeout', 'kick', 'ban', 'unban', 'mute', 'unmute'],
  },
  reason: { type: String, default: 'No reason provided' },
  duration: { type: Number, default: null },
  evidence: { type: String, default: null },
  automated: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
}, { timestamps: true });

moderationCaseSchema.index({ guildId: 1, caseNumber: 1 }, { unique: true });
moderationCaseSchema.index({ guildId: 1, userId: 1 });

module.exports = mongoose.model('ModerationCase', moderationCaseSchema);
