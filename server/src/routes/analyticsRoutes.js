const express = require('express');
const router = express.Router({ mergeParams: true });
const { getWorkspaceAnalytics, getMemberContributions } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/:workspaceId', getWorkspaceAnalytics);
router.get('/:workspaceId/contributions', getMemberContributions);

module.exports = router;
