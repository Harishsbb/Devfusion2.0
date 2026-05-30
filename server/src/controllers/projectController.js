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
    const oldProject = await Project.findById(req.params.id);
    if (!oldProject) return res.status(404).json({ success: false, message: 'Project not found' });

    if (oldProject.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized: Only the project creator can manage team members or update the project.' });
    }

    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Handle project membership change notifications
    if (req.body.members) {
      const oldUserIds = (oldProject.members || []).map(m => m.user.toString());
      const newUserIds = (req.body.members || []).map(m => m.user.toString());
      const addedUserIds = newUserIds.filter(id => !oldUserIds.includes(id) && id !== req.user._id.toString());

      if (addedUserIds.length > 0) {
        const Notification = require('../models/Notification');
        const io = req.app.get('io');

        await Promise.all(addedUserIds.map(async (userId) => {
          const notification = await Notification.create({
            recipient: userId,
            sender: req.user._id,
            type: 'project_invite',
            title: 'Project Assignment',
            message: `${req.user.name} added you to the project "${project.name}"`,
            link: `/workspace/${project.workspace}/project/${project._id}`,
            metadata: { projectId: project._id, workspaceId: project.workspace },
          });

          if (io) {
            io.to(`user:${userId}`).emit('notification:new', {
              ...notification.toObject(),
              sender: {
                _id: req.user._id,
                name: req.user.name,
                avatar: req.user.avatar,
              }
            });
          }
        }));
      }
    }

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized: Only the project creator can delete this project.' });
    }
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
