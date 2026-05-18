const express = require('express');
const router = express.Router();
const { generateTaskBreakdown, generateStandup, generateProjectSummary, reviewCode, detectBlockers, chat } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/breakdown', generateTaskBreakdown);
router.post('/standup', generateStandup);
router.get('/summary/:projectId', generateProjectSummary);
router.post('/code-review', reviewCode);
router.get('/blockers/:projectId', detectBlockers);
router.post('/chat', chat);

module.exports = router;
