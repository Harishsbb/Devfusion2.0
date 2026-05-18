const Workspace = require('../models/Workspace');
const User = require('../models/User');
const Project = require('../models/Project');

exports.createWorkspace = async (req, res, next) => {
  try {
    const { name, description, color, isPublic } = req.body;
    const workspace = await Workspace.create({
      name, description, color, isPublic,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });
    await workspace.populate('members.user', 'name email avatar');
    res.status(201).json({ success: true, workspace });
  } catch (error) {
    next(error);
  }
};

exports.getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({ 'members.user': req.user._id })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort('-createdAt');
    res.json({ success: true, workspaces });
  } catch (error) {
    next(error);
  }
};

exports.getWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar isOnline lastSeen');
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }
    const isMember = workspace.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not a member of this workspace' });
    }
    const projectCount = await Project.countDocuments({ workspace: workspace._id });
    res.json({ success: true, workspace: { ...workspace.toObject(), projectCount } });
  } catch (error) {
    next(error);
  }
};

exports.updateWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    const member = workspace.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || !['owner', 'admin'].includes(member.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await Workspace.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('members.user', 'name email avatar');
    res.json({ success: true, workspace: updated });
  } catch (error) {
    next(error);
  }
};

exports.inviteMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    const invitedUser = await User.findOne({ email });
    if (!invitedUser) return res.status(404).json({ success: false, message: 'User not found' });
    const alreadyMember = workspace.members.some(m => m.user.toString() === invitedUser._id.toString());
    if (alreadyMember) return res.status(400).json({ success: false, message: 'User is already a member' });
    workspace.members.push({ user: invitedUser._id, role: role || 'member' });
    await workspace.save();
    await workspace.populate('members.user', 'name email avatar');
    res.json({ success: true, workspace, message: `${invitedUser.name} added to workspace` });
  } catch (error) {
    next(error);
  }
};

exports.removeMember = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    workspace.members = workspace.members.filter(m => m.user.toString() !== req.params.userId);
    await workspace.save();
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    next(error);
  }
};

exports.getWorkspaceStats = async (req, res, next) => {
  try {
    const Task = require('../models/Task');
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    const [totalProjects, activeProjects, totalTasks, completedTasks] = await Promise.all([
      Project.countDocuments({ workspace: workspace._id }),
      Project.countDocuments({ workspace: workspace._id, status: 'active' }),
      Task.countDocuments({ workspace: workspace._id }),
      Task.countDocuments({ workspace: workspace._id, status: 'done' }),
    ]);
    res.json({
      success: true,
      stats: { totalProjects, activeProjects, totalTasks, completedTasks, totalMembers: workspace.members.length },
    });
  } catch (error) {
    next(error);
  }
};
