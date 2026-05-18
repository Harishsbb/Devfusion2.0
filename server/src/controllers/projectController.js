const Project = require('../models/Project');
const Task = require('../models/Task');
const Workspace = require('../models/Workspace');

exports.createProject = async (req, res, next) => {
  try {
    const { name, description, color, emoji, tags, dueDate, startDate, priority } = req.body;
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    const project = await Project.create({
      name, description, color, emoji, tags, dueDate, startDate, priority,
      workspace: workspace._id,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'lead' }],
    });
    await project.populate('owner', 'name email avatar');
    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      workspace: req.params.workspaceId,
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort('-updatedAt');
    res.json({ success: true, projects });
  } catch (error) {
    next(error);
  }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar isOnline');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const taskStats = await Task.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const stats = { todo: 0, inprogress: 0, inreview: 0, done: 0 };
    taskStats.forEach(s => { stats[s._id] = s.count; });
    const totalTasks = Object.values(stats).reduce((a, b) => a + b, 0);
    const progress = totalTasks > 0 ? Math.round((stats.done / totalTasks) * 100) : 0;
    res.json({ success: true, project: { ...project.toObject(), taskStats: stats, progress } });
  } catch (error) {
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
};

exports.getProjectActivity = async (req, res, next) => {
  try {
    const tasks = await Task.find({ project: req.params.id })
      .populate('assignee', 'name avatar')
      .populate('reporter', 'name avatar')
      .sort('-updatedAt')
      .limit(20);
    res.json({ success: true, activities: tasks });
  } catch (error) {
    next(error);
  }
};
