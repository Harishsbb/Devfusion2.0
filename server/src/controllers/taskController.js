const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

exports.createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, assignee, dueDate, labels, estimatedHours } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    
    const taskData = {
      title,
      description,
      status,
      priority,
      labels,
      estimatedHours,
      project: project._id,
      workspace: project.workspace,
      reporter: req.user._id,
    };
    if (assignee && assignee.trim() !== '') {
      taskData.assignee = assignee;
    }
    if (dueDate && dueDate.trim() !== '') {
      taskData.dueDate = dueDate;
    }

    const task = await Task.create(taskData);
    await task.populate(['assignee', 'reporter'].map(f => ({ path: f, select: 'name email avatar' })));
    if (task.assignee && task.assignee.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: task.assignee._id || task.assignee,
        sender: req.user._id,
        type: 'task_assigned',
        title: 'New task assigned',
        message: `${req.user.name} assigned you "${title}"`,
        link: `/projects/${project._id}/tasks/${task._id}`,
      });

      // Emit real-time notification
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${(task.assignee._id || task.assignee).toString()}`).emit('notification:new', {
          ...notification.toObject(),
          sender: {
            _id: req.user._id,
            name: req.user.name,
            avatar: req.user.avatar,
          }
        });
      }
    }
    await Project.findByIdAndUpdate(project._id, { $inc: { taskCount: 1 } });
    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, assignee, search } = req.query;
    const query = { project: req.params.projectId, isArchived: false };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    const tasks = await Task.find(query)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .sort('order');
    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('comments.author', 'name email avatar');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) return res.status(404).json({ success: false, message: 'Task not found' });
    if (req.body.status === 'done' && oldTask.status !== 'done') {
      req.body.completedAt = new Date();
      await Project.findByIdAndUpdate(oldTask.project, { $inc: { completedTaskCount: 1 } });
    }
    
    // Clean empty strings to null to avoid CastError
    if (req.body.assignee === '') req.body.assignee = null;
    if (req.body.dueDate === '') req.body.dueDate = null;

    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar');
    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    await task.deleteOne();
    await Project.findByIdAndUpdate(task.project, { $inc: { taskCount: -1 } });
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    task.comments.push({ author: req.user._id, content: req.body.content });
    await task.save();
    await task.populate('comments.author', 'name email avatar');
    const newComment = task.comments[task.comments.length - 1];
    res.json({ success: true, comment: newComment });
  } catch (error) {
    next(error);
  }
};

exports.updateTaskOrder = async (req, res, next) => {
  try {
    const { tasks } = req.body;
    const bulkOps = tasks.map(t => ({
      updateOne: { filter: { _id: t._id }, update: { status: t.status, order: t.order } },
    }));
    await Task.bulkWrite(bulkOps);
    res.json({ success: true, message: 'Task order updated' });
  } catch (error) {
    next(error);
  }
};
