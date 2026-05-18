const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  content: { type: String, required: true },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  editedAt: { type: Date, default: Date.now },
  summary: { type: String, default: 'Updated document' },
});

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, default: '' },
  emoji: { type: String, default: '📄' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
  isPublished: { type: Boolean, default: false },
  tags: [{ type: String }],
  versions: [versionSchema],
  views: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
