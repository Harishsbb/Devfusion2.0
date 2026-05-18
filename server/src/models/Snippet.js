const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  code: { type: String, required: true },
  language: { type: String, required: true, default: 'javascript' },
  tags: [{ type: String }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  isPublic: { type: Boolean, default: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  copies: { type: Number, default: 0 },
}, { timestamps: true });

snippetSchema.index({ workspace: 1, language: 1 });
snippetSchema.index({ tags: 1 });

module.exports = mongoose.model('Snippet', snippetSchema);
