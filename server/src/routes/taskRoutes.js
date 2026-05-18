const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createTask, getTasks, getTask, updateTask, deleteTask, addComment, updateTaskOrder,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getTasks).post(createTask);
router.put('/reorder', updateTaskOrder);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);
router.post('/:id/comments', addComment);

module.exports = router;
