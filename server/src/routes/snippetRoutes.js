const express = require('express');
const router = express.Router({ mergeParams: true });
const { createSnippet, getSnippets, getSnippet, updateSnippet, deleteSnippet, copySnippet } = require('../controllers/snippetController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getSnippets).post(createSnippet);
router.route('/:id').get(getSnippet).put(updateSnippet).delete(deleteSnippet);
router.post('/:id/copy', copySnippet);

module.exports = router;
