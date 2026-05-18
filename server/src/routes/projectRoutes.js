const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createProject, getProjects, getProject, updateProject, deleteProject, getProjectActivity,
} = require('../controllers/projectController');
const taskRoutes = require('./taskRoutes');
const documentRoutes = require('./documentRoutes');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getProjects).post(createProject);
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);
router.get('/:id/activity', getProjectActivity);
router.use('/:projectId/tasks', taskRoutes);
router.use('/:projectId/documents', documentRoutes);

module.exports = router;
