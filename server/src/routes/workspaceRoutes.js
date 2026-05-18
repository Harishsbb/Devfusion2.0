const express = require('express');
const router = express.Router();
const {
  createWorkspace, getWorkspaces, getWorkspace, updateWorkspace,
  inviteMember, removeMember, getWorkspaceStats,
} = require('../controllers/workspaceController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getWorkspaces).post(createWorkspace);
router.route('/:id').get(getWorkspace).put(updateWorkspace);
router.get('/:id/stats', getWorkspaceStats);
router.post('/:id/invite', inviteMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
