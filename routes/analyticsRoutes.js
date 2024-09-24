const express = require('express');
const Task = require('../models/Task');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Get task analytics for a user
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Total tasks by category
    const tasksByCategory = await Task.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$category", total: { $sum: 1 } } }
    ]);

    // Task completion rate
    const totalTasks = await Task.countDocuments({ user: userId });
    const completedTasks = await Task.countDocuments({ user: userId, status: 'Completed' });
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Upcoming tasks
    const now = new Date();
    const upcomingTasks = await Task.find({
      user: userId,
      status: 'Pending',
      dueDate: { $gte: now }
    });

    // Overdue tasks
    const overdueTasks = await Task.find({
      user: userId,
      status: 'Pending',
      dueDate: { $lte: now }
    });

    res.json({
      tasksByCategory,
      completionRate,
      upcomingTasks,
      overdueTasks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
