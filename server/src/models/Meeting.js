const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['text', 'file', 'code', 'system', 'emoji'], default: 'text' },
  codeLanguage: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  reactions: [{ emoji: String, users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] }],
  replyTo: { type: mongoose.Schema.Types.ObjectId, default: null },
  isPinned: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const attendeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['host', 'participant'], default: 'participant' },
  status: { type: String, enum: ['invited', 'joined', 'left', 'declined'], default: 'invited' },
  joinedAt: { type: Date },
  leftAt: { type: Date },
  handRaised: { type: Boolean, default: false },
  isMuted: { type: Boolean, default: false },
  isCameraOff: { type: Boolean, default: false },
}, { _id: false });

const meetingSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    unique: true,
    default: () => `DCM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendees: [attendeeSchema],
  type: { type: String, enum: ['instant', 'scheduled'], default: 'instant' },
  status: { type: String, enum: ['waiting', 'active', 'ended', 'cancelled'], default: 'waiting' },
  scheduledAt: { type: Date },
  startedAt: { type: Date },
  endedAt: { type: Date },
  duration: { type: Number, default: 0 },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  chat: [chatMessageSchema],
  recording: {
    isRecording: { type: Boolean, default: false },
    url: { type: String, default: '' },
    startedAt: { type: Date },
    duration: { type: Number, default: 0 },
  },
  aiSummary: {
    summary: { type: String, default: '' },
    notes: { type: String, default: '' },
    actionItems: [{ text: String, assignee: String, priority: { type: String, default: 'medium' } }],
    keyDecisions: [{ type: String }],
    discussionTopics: [{ type: String }],
    attendanceReport: [{
      userName: String,
      duration: Number,
      joinedAt: Date,
      leftAt: Date,
    }],
    generatedAt: { type: Date },
  },
  settings: {
    allowRecording: { type: Boolean, default: true },
    allowScreenShare: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false },
    maxParticipants: { type: Number, default: 50 },
  },
  tags: [{ type: String }],
}, { timestamps: true });

meetingSchema.index({ workspace: 1, status: 1, createdAt: -1 });
meetingSchema.index({ meetingId: 1 });
meetingSchema.index({ 'attendees.user': 1 });
meetingSchema.index({ scheduledAt: 1, status: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
