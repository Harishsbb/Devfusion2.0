const Snippet = require('../models/Snippet');

exports.createSnippet = async (req, res, next) => {
  try {
    const { title, description, code, language, tags, isPublic, project } = req.body;
    const snippet = await Snippet.create({
      title, description, code, language, tags, isPublic, project,
      author: req.user._id,
      workspace: req.params.workspaceId,
    });
    await snippet.populate('author', 'name avatar');
    res.status(201).json({ success: true, snippet });
  } catch (error) {
    next(error);
  }
};

exports.getSnippets = async (req, res, next) => {
  try {
    const { language, tag, search } = req.query;
    const query = { workspace: req.params.workspaceId };
    if (language) query.language = language;
    if (tag) query.tags = tag;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    const snippets = await Snippet.find(query)
      .populate('author', 'name avatar')
      .sort('-createdAt');
    res.json({ success: true, snippets });
  } catch (error) {
    next(error);
  }
};

exports.getSnippet = async (req, res, next) => {
  try {
    const snippet = await Snippet.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name avatar');
    if (!snippet) return res.status(404).json({ success: false, message: 'Snippet not found' });
    res.json({ success: true, snippet });
  } catch (error) {
    next(error);
  }
};

exports.updateSnippet = async (req, res, next) => {
  try {
    const snippet = await Snippet.findOneAndUpdate(
      { _id: req.params.id, author: req.user._id },
      req.body,
      { new: true }
    ).populate('author', 'name avatar');
    if (!snippet) return res.status(404).json({ success: false, message: 'Snippet not found or not authorized' });
    res.json({ success: true, snippet });
  } catch (error) {
    next(error);
  }
};

exports.deleteSnippet = async (req, res, next) => {
  try {
    await Snippet.findOneAndDelete({ _id: req.params.id, author: req.user._id });
    res.json({ success: true, message: 'Snippet deleted' });
  } catch (error) {
    next(error);
  }
};

exports.copySnippet = async (req, res, next) => {
  try {
    await Snippet.findByIdAndUpdate(req.params.id, { $inc: { copies: 1 } });
    res.json({ success: true, message: 'Snippet copied' });
  } catch (error) {
    next(error);
  }
};
