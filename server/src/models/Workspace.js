const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'active'], default: 'active' },
});

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  slug: { type: String, unique: true, lowercase: true },
  logo: { type: String, default: '' },
  color: { type: String, default: '#6366f1' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  inviteCode: { type: String, unique: true },
  isPublic: { type: Boolean, default: false },
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  settings: {
    allowMemberInvite: { type: Boolean, default: true },
    defaultProjectVisibility: { type: String, default: 'team' },
  },
}, { timestamps: true });

workspaceSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  }
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Workspace', workspaceSchema);
