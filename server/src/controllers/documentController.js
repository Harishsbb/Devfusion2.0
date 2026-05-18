const Document = require('../models/Document');

exports.createDocument = async (req, res, next) => {
  try {
    const { title, content, emoji, tags, parent } = req.body;
    const project = await require('../models/Project').findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const doc = await Document.create({
      title, content, emoji, tags, parent,
      project: project._id,
      workspace: project.workspace,
      author: req.user._id,
      lastEditedBy: req.user._id,
    });
    await doc.populate('author', 'name avatar');
    res.status(201).json({ success: true, document: doc });
  } catch (error) {
    next(error);
  }
};

exports.getDocuments = async (req, res, next) => {
  try {
    const docs = await Document.find({ project: req.params.projectId, parent: null })
      .populate('author', 'name avatar')
      .populate('lastEditedBy', 'name avatar')
      .sort('-updatedAt');
    res.json({ success: true, documents: docs });
  } catch (error) {
    next(error);
  }
};

exports.getDocument = async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndUpdate(
      req.params.id, { $inc: { views: 1 } }, { new: true }
    )
      .populate('author', 'name avatar')
      .populate('lastEditedBy', 'name avatar');
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, document: doc });
  } catch (error) {
    next(error);
  }
};

exports.updateDocument = async (req, res, next) => {
  try {
    const { content, title, emoji } = req.body;
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    doc.versions.push({ content: doc.content, editedBy: req.user._id });
    if (doc.versions.length > 20) doc.versions.shift();
    if (title !== undefined) doc.title = title;
    if (content !== undefined) doc.content = content;
    if (emoji !== undefined) doc.emoji = emoji;
    doc.lastEditedBy = req.user._id;
    await doc.save();
    await doc.populate('author lastEditedBy', 'name avatar');
    res.json({ success: true, document: doc });
  } catch (error) {
    next(error);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    await Document.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    next(error);
  }
};
