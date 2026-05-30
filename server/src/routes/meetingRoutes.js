const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getMeetings, getMeetingStats, getMeeting, getMeetingByMeetingId,
  createMeeting, updateMeeting, deleteMeeting,
  joinMeeting, leaveMeeting, endMeeting,
  sendChatMessage, reactToMessage, pinMessage,
  generateAISummary, convertToTasks, inviteAttendees,
} = require('../controllers/meetingController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getMeetingStats);
router.get('/join/:meetingId', getMeetingByMeetingId);
router.route('/').get(getMeetings).post(createMeeting);
router.route('/:id').get(getMeeting).put(updateMeeting).delete(deleteMeeting);
router.post('/:id/join', joinMeeting);
router.post('/:id/leave', leaveMeeting);
router.post('/:id/end', endMeeting);
router.post('/:id/chat', sendChatMessage);
router.put('/:id/chat/:messageId/react', reactToMessage);
router.put('/:id/chat/:messageId/pin', pinMessage);
router.post('/:id/ai-summary', generateAISummary);
router.post('/:id/convert-tasks', convertToTasks);
router.post('/:id/invite', inviteAttendees);

module.exports = router;
