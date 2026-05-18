const express = require('express');
const router = express.Router({ mergeParams: true });
const { createDocument, getDocuments, getDocument, updateDocument, deleteDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getDocuments).post(createDocument);
router.route('/:id').get(getDocument).put(updateDocument).delete(deleteDocument);

module.exports = router;
