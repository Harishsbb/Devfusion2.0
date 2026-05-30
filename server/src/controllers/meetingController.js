const Meeting = require('../models/Meeting');
const Notification = require('../models/Notification');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

// Helper: send notification + socket event to a user
const sendNotification = async (io, { recipient, sender, type, title, message, link, metadata }) => {
  const notification = await Notification.create({ recipient, sender, type, title, message, link, metadata });
  const populated = await Notification.findById(notification._id).populate('sender', 'name avatar');
  if (io) io.to(`user:${recipient.toString()}`).emit('notification:new', populated.toObject());
};

// Helper: emit to meeting room
const emitToMeeting = (io, meetingId, event, data) => {
  if (io) io.to(`meeting:${meetingId}`).emit(event, data);
};

exports.getMeetings = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { status, type } = req.query;

    const query = {
      workspace: workspaceId,
      $or: [
        { organizer: req.user._id },
        { 'attendees.user': req.user._id },
      ],
    };
    if (status) query.status = status;
    if (type) query.type = type;

    const meetings = await Meeting.find(query)
      .populate('organizer', 'name email avatar isOnline')
      .populate('attendees.user', 'name email avatar isOnline')
      .populate('project', 'name color emoji')
      .select('-chat')
      .sort('-createdAt');

    res.json({ success: true, meetings });
  } catch (error) {
    next(error);
  }
};

exports.getMeetingStats = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const baseQuery = {
      workspace: workspaceId,
      $or: [{ organizer: req.user._id }, { 'attendees.user': req.user._id }],
    };

    const [total, active, scheduled, completed] = await Promise.all([
      Meeting.countDocuments(baseQuery),
      Meeting.countDocuments({ ...baseQuery, status: 'active' }),
      Meeting.countDocuments({ ...baseQuery, status: 'waiting', type: 'scheduled' }),
      Meeting.countDocuments({ ...baseQuery, status: 'ended' }),
    ]);

    res.json({ success: true, stats: { total, active, scheduled, completed } });
  } catch (error) {
    next(error);
  }
};

exports.getMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizer', 'name email avatar isOnline')
      .populate('attendees.user', 'name email avatar isOnline')
      .populate('project', 'name color emoji')
      .populate('chat.sender', 'name avatar');

    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, meeting });
  } catch (error) {
    next(error);
  }
};

exports.getMeetingByMeetingId = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId })
      .populate('organizer', 'name email avatar isOnline')
      .populate('attendees.user', 'name email avatar isOnline')
      .populate('project', 'name color emoji');

    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, meeting });
  } catch (error) {
    next(error);
  }
};

exports.createMeeting = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { title, description, type, scheduledAt, invitees, project, tags, settings } = req.body;

    const workspace = await Workspace.findById(workspaceId).populate('members.user', 'name email avatar');
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    const meetingData = {
      title: title || (type === 'instant' ? 'Instant Meeting' : 'Team Meeting'),
      description: description || '',
      workspace: workspaceId,
      organizer: req.user._id,
      type: type || 'instant',
      status: type === 'instant' ? 'active' : 'waiting',
      startedAt: type === 'instant' ? new Date() : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      project: project || null,
      tags: tags || [],
      settings: settings || {},
      attendees: [{ user: req.user._id, role: 'host', status: 'joined', joinedAt: new Date() }],
    };

    if (invitees && invitees.length > 0) {
      const uniqueInvitees = invitees.filter(id => id !== req.user._id.toString());
      uniqueInvitees.forEach(userId => {
        meetingData.attendees.push({ user: userId, role: 'participant', status: 'invited' });
      });
    }

    const meeting = await Meeting.create(meetingData);
    await meeting.populate([
      { path: 'organizer', select: 'name email avatar isOnline' },
      { path: 'attendees.user', select: 'name email avatar isOnline' },
      { path: 'project', select: 'name color emoji' },
    ]);

    // Notify invited attendees
    const io = req.app.get('io');
    const invitedAttendees = meeting.attendees.filter(a =>
      a.user._id.toString() !== req.user._id.toString() && a.status === 'invited'
    );

    await Promise.all(invitedAttendees.map(async (attendee) => {
      const notifMessage = type === 'instant'
        ? `${req.user.name} invited you to join an active meeting: "${meeting.title}"`
        : `${req.user.name} scheduled a meeting: "${meeting.title}"`;

      await sendNotification(io, {
        recipient: attendee.user._id,
        sender: req.user._id,
        type: 'meeting_invite',
        title: 'Meeting Invitation',
        message: notifMessage,
        link: `/workspace/${workspaceId}/meetings`,
        metadata: { meetingId: meeting._id, meetingCode: meeting.meetingId, workspaceId },
      });
    }));

    // Broadcast new meeting to workspace
    if (io) io.to(`workspace:${workspaceId}`).emit('meeting:created', { meeting });

    res.status(201).json({ success: true, meeting });
  } catch (error) {
    next(error);
  }
};

exports.updateMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    if (meeting.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const allowedFields = ['title', 'description', 'scheduledAt', 'project', 'tags', 'settings'];
    const updates = {};
    allowedFields.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

    const updated = await Meeting.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('organizer', 'name email avatar isOnline')
      .populate('attendees.user', 'name email avatar isOnline')
      .populate('project', 'name color emoji')
      .select('-chat');

    const io = req.app.get('io');
    emitToMeeting(io, meeting.meetingId, 'meeting:updated', { meeting: updated });

    res.json({ success: true, meeting: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    if (meeting.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const io = req.app.get('io');
    emitToMeeting(io, meeting.meetingId, 'meeting:deleted', { meetingId: meeting._id });
    await meeting.deleteOne();

    res.json({ success: true, message: 'Meeting deleted' });
  } catch (error) {
    next(error);
  }
};

exports.joinMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    if (meeting.status === 'ended' || meeting.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Meeting has already ended' });
    }

    const userId = req.user._id.toString();
    const existingIdx = meeting.attendees.findIndex(a => a.user.toString() === userId);

    if (existingIdx >= 0) {
      meeting.attendees[existingIdx].status = 'joined';
      meeting.attendees[existingIdx].joinedAt = new Date();
    } else {
      meeting.attendees.push({ user: req.user._id, role: 'participant', status: 'joined', joinedAt: new Date() });
    }

    if (meeting.status === 'waiting' && meeting.organizer.toString() === userId) {
      meeting.status = 'active';
      meeting.startedAt = new Date();
    }

    await meeting.save();
    await meeting.populate([
      { path: 'organizer', select: 'name email avatar isOnline' },
      { path: 'attendees.user', select: 'name email avatar isOnline' },
      { path: 'project', select: 'name color emoji' },
    ]);

    const io = req.app.get('io');
    emitToMeeting(io, meeting.meetingId, 'participant:joined', {
      user: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar },
      attendees: meeting.attendees,
    });

    res.json({ success: true, meeting });
  } catch (error) {
    next(error);
  }
};

exports.leaveMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    const userId = req.user._id.toString();
    const attendeeIdx = meeting.attendees.findIndex(a => a.user.toString() === userId);
    if (attendeeIdx >= 0) {
      meeting.attendees[attendeeIdx].status = 'left';
      meeting.attendees[attendeeIdx].leftAt = new Date();
    }

    await meeting.save();

    const io = req.app.get('io');
    emitToMeeting(io, meeting.meetingId, 'participant:left', {
      userId: req.user._id,
      userName: req.user.name,
      attendees: meeting.attendees,
    });

    res.json({ success: true, message: 'Left meeting' });
  } catch (error) {
    next(error);
  }
};

exports.endMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    if (meeting.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can end the meeting' });
    }

    const endedAt = new Date();
    const durationMs = meeting.startedAt ? endedAt - meeting.startedAt : 0;
    const durationMin = Math.round(durationMs / 60000);

    meeting.status = 'ended';
    meeting.endedAt = endedAt;
    meeting.duration = durationMin;
    meeting.attendees.forEach((a, i) => {
      if (a.status === 'joined') {
        meeting.attendees[i].status = 'left';
        meeting.attendees[i].leftAt = endedAt;
      }
    });

    await meeting.save();

    const io = req.app.get('io');
    emitToMeeting(io, meeting.meetingId, 'meeting:ended', {
      meetingId: meeting._id,
      duration: durationMin,
    });

    res.json({ success: true, message: 'Meeting ended', duration: durationMin });
  } catch (error) {
    next(error);
  }
};

exports.sendChatMessage = async (req, res, next) => {
  try {
    const { message, type, codeLanguage, replyTo } = req.body;
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    const chatMsg = {
      sender: req.user._id,
      message,
      type: type || 'text',
      codeLanguage: codeLanguage || '',
      replyTo: replyTo || null,
    };

    meeting.chat.push(chatMsg);
    await meeting.save();

    const newMsg = meeting.chat[meeting.chat.length - 1];
    const populated = {
      ...newMsg.toObject(),
      sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar },
    };

    const io = req.app.get('io');
    emitToMeeting(io, meeting.meetingId, 'meeting:message', populated);

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    next(error);
  }
};

exports.reactToMessage = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    const msgIdx = meeting.chat.findIndex(m => m._id.toString() === req.params.messageId);
    if (msgIdx < 0) return res.status(404).json({ success: false, message: 'Message not found' });

    const msg = meeting.chat[msgIdx];
    const reactionIdx = msg.reactions.findIndex(r => r.emoji === emoji);
    const userId = req.user._id;

    if (reactionIdx >= 0) {
      const userIdx = msg.reactions[reactionIdx].users.findIndex(u => u.toString() === userId.toString());
      if (userIdx >= 0) {
        msg.reactions[reactionIdx].users.splice(userIdx, 1);
        if (msg.reactions[reactionIdx].users.length === 0) msg.reactions.splice(reactionIdx, 1);
      } else {
        msg.reactions[reactionIdx].users.push(userId);
      }
    } else {
      msg.reactions.push({ emoji, users: [userId] });
    }

    await meeting.save();

    const io = req.app.get('io');
    emitToMeeting(io, meeting.meetingId, 'message:reaction', {
      messageId: req.params.messageId,
      reactions: msg.reactions,
    });

    res.json({ success: true, reactions: msg.reactions });
  } catch (error) {
    next(error);
  }
};

exports.pinMessage = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    const msgIdx = meeting.chat.findIndex(m => m._id.toString() === req.params.messageId);
    if (msgIdx < 0) return res.status(404).json({ success: false, message: 'Message not found' });

    meeting.chat[msgIdx].isPinned = !meeting.chat[msgIdx].isPinned;
    await meeting.save();

    const io = req.app.get('io');
    emitToMeeting(io, meeting.meetingId, 'message:pinned', {
      messageId: req.params.messageId,
      isPinned: meeting.chat[msgIdx].isPinned,
    });

    res.json({ success: true, isPinned: meeting.chat[msgIdx].isPinned });
  } catch (error) {
    next(error);
  }
};

exports.generateAISummary = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('attendees.user', 'name')
      .populate('chat.sender', 'name');

    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    if (meeting.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can generate AI summary' });
    }

    const chatMessages = meeting.chat.filter(m => m.type !== 'system' && !m.isDeleted);
    const attendeeNames = meeting.attendees.map(a => a.user?.name || 'Unknown').join(', ');
    const durationStr = meeting.duration > 0 ? `${meeting.duration} minutes` : 'ongoing';

    // Mock AI summary generation (swap GEMINI_API_KEY for real AI)
    const topics = ['Project updates', 'Technical architecture decisions', 'Timeline discussion', 'Resource allocation'];
    const decisions = [
      `Team agreed to use the proposed technical stack`,
      `Next sprint planning scheduled for next week`,
      `${meeting.attendees[0]?.user?.name || 'Team lead'} to coordinate with stakeholders`,
    ];
    const actionItems = [
      { text: 'Review and finalize technical documentation', assignee: attendeeNames.split(',')[0]?.trim() || 'Team', priority: 'high' },
      { text: 'Set up development environment for new members', assignee: attendeeNames.split(',')[1]?.trim() || 'Team', priority: 'medium' },
      { text: 'Schedule follow-up meeting for progress review', assignee: meeting.attendees.find(a => a.role === 'host')?.user?.name || 'Host', priority: 'medium' },
    ];

    const aiSummary = {
      summary: `This ${durationStr} meeting covered ${topics.length} key topics with ${meeting.attendees.length} participants (${attendeeNames}). The team made progress on ${meeting.title} with ${chatMessages.length} messages exchanged. Key outcomes include alignment on project direction and clear action items assigned to team members.`,
      notes: `## Meeting Notes: ${meeting.title}\n\n**Date:** ${new Date().toLocaleDateString()}\n**Duration:** ${durationStr}\n**Attendees:** ${attendeeNames}\n\n### Discussion Highlights\n${topics.map(t => `- ${t}`).join('\n')}\n\n### Decisions Made\n${decisions.map(d => `- ${d}`).join('\n')}\n\n### Next Steps\nFollow-up meeting to be scheduled. Team to complete assigned action items before next sync.`,
      actionItems,
      keyDecisions: decisions,
      discussionTopics: topics,
      attendanceReport: meeting.attendees.map(a => ({
        userName: a.user?.name || 'Unknown',
        duration: meeting.duration || 0,
        joinedAt: a.joinedAt,
        leftAt: a.leftAt || new Date(),
      })),
      generatedAt: new Date(),
    };

    meeting.aiSummary = aiSummary;
    await meeting.save();

    res.json({ success: true, aiSummary });
  } catch (error) {
    next(error);
  }
};

exports.convertToTasks = async (req, res, next) => {
  try {
    const { items, projectId } = req.body;
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    const Task = require('../models/Task');
    const Project = require('../models/Project');

    if (!projectId) return res.status(400).json({ success: false, message: 'Project ID required' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const createdTasks = await Promise.all(
      items.map(item => Task.create({
        title: item.text,
        description: `Generated from meeting: ${meeting.title} on ${new Date().toLocaleDateString()}`,
        project: projectId,
        workspace: meeting.workspace,
        createdBy: req.user._id,
        priority: item.priority || 'medium',
        status: 'todo',
        tags: ['meeting-action'],
      }))
    );

    project.taskCount = (project.taskCount || 0) + createdTasks.length;
    await project.save();

    res.json({ success: true, tasks: createdTasks, message: `${createdTasks.length} tasks created` });
  } catch (error) {
    next(error);
  }
};

exports.inviteAttendees = async (req, res, next) => {
  try {
    const { userIds } = req.body;
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    const existingUserIds = meeting.attendees.map(a => a.user.toString());
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

    newUserIds.forEach(userId => {
      meeting.attendees.push({ user: userId, role: 'participant', status: 'invited' });
    });
    await meeting.save();

    await meeting.populate('attendees.user', 'name email avatar isOnline');

    const io = req.app.get('io');
    await Promise.all(newUserIds.map(async (userId) => {
      await sendNotification(io, {
        recipient: userId,
        sender: req.user._id,
        type: 'meeting_invite',
        title: 'Meeting Invitation',
        message: `${req.user.name} invited you to join "${meeting.title}"`,
        link: `/workspace/${meeting.workspace}/meetings`,
        metadata: { meetingId: meeting._id, meetingCode: meeting.meetingId },
      });
    }));

    res.json({ success: true, attendees: meeting.attendees });
  } catch (error) {
    next(error);
  }
};
