const mongoose = require('mongoose');

const guildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  prefix: { type: String, default: '!' },
  language: { type: String, default: 'en', enum: ['en', 'fr', 'ar', 'es', 'pt', 'de'] },
  modules: {
    security: { type: Boolean, default: true },
    moderation: { type: Boolean, default: true },
    tempvoice: { type: Boolean, default: false },
    tickets: { type: Boolean, default: false },
    welcome: { type: Boolean, default: false },
    autorole: { type: Boolean, default: false },
    leveling: { type: Boolean, default: false },
    suggestions: { type: Boolean, default: false },
    verification: { type: Boolean, default: false },
    logging: { type: Boolean, default: true },
  },
  setupCompleted: { type: Boolean, default: false },
  serverType: { type: String, enum: ['community', 'gaming', 'shop', 'creator', 'support', 'custom', ''], default: '' },
  staffRoles: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('GuildConfig', guildConfigSchema);
