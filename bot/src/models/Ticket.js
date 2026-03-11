const { mongoose } = require('mongoose');

const ticketCategorySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  emoji: { type: String, default: '🎫' },
  description: { type: String, default: '' },
  staffRoles: [{ type: String }],
  categoryChannelId: { type: String, default: null },
}, { _id: false });

const ticketConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: false },
  panelChannelId: { type: String, default: null },
  panelMessageId: { type: String, default: null },
  logChannelId: { type: String, default: null },
  transcriptChannelId: { type: String, default: null },
  maxTicketsPerUser: { type: Number, default: 3 },
  categories: [ticketCategorySchema],
  staffRoles: [{ type: String }],
  closeConfirmation: { type: Boolean, default: true },
  autoCloseHours: { type: Number, default: 0 },
}, { timestamps: true });

const ticketSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  ticketNumber: { type: Number, required: true },
  categoryId: { type: String, default: 'general' },
  status: { type: String, default: 'open', enum: ['open', 'closed', 'claimed'] },
  claimedBy: { type: String, default: null },
  priority: { type: String, default: 'normal', enum: ['low', 'normal', 'high', 'urgent'] },
  addedMembers: [{ type: String }],
  subject: { type: String, default: '' },
  closedAt: { type: Date, default: null },
  closedBy: { type: String, default: null },
}, { timestamps: true });

ticketSchema.index({ guildId: 1, userId: 1, status: 1 });
ticketSchema.index({ guildId: 1, ticketNumber: 1 }, { unique: true });

const TicketConfig = mongoose.model('TicketConfig', ticketConfigSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = { TicketConfig, Ticket };
