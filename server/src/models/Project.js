const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['lead', 'developer', 'designer', 'tester', 'admin', 'viewer'], default: 'developer' },
  }],
  status: { type: String, enum: ['active', 'paused', 'completed', 'archived'], default: 'active' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  color: { type: String, default: '#6366f1' },
  emoji: { type: String, default: '🚀' },
  tags: [{ type: String }],
  startDate: { type: Date },
  dueDate: { type: Date },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  githubRepo: { type: String, default: '' },
  isPublic: { type: Boolean, default: false },
  taskCount: { type: Number, default: 0 },
  completedTaskCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
