const express = require('express');
const Task = require('../models/Task');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Create a task (POST /api/tasks)
router.post('/', protect, async (req, res) => {
  const { title, description, priority, dueDate, category, recurrence, dependencies } = req.body;  // Add dependencies
  try {
    const task = new Task({
      user: req.user.id,  // Retrieved from the protect middleware
      title,
      description,
      priority,
      dueDate,
      category,
      recurrence,  // Save recurrence in the task model
      dependencies,  // Save dependencies in the task model
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all tasks with filtering (GET /api/tasks)
router.get('/', protect, async (req, res) => {
  const { priority, category, dueDate } = req.query;
  
  const query = { user: req.user.id };

  if (priority) {
    query.priority = priority;
  }
  
  if (category) {
    query.category = category;
  }
  
  if (dueDate) {
    query.dueDate = { $lte: new Date(dueDate) };  // Get tasks with dueDate before or on the specified date
  }

  try {
    const tasks = await Task.find(query).populate('dependencies');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a task (PUT /api/tasks/:id)
router.put('/:id', protect, async (req, res) => {
  const { title, description, priority, dueDate, category, status, recurrence, dependencies } = req.body;  // Add dependencies
  try {
    const task = await Task.findById(req.params.id);
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this task' });
    }

    task.title = title || task.title;
    task.description = description || task.description;
    task.priority = priority || task.priority;
    task.dueDate = dueDate || task.dueDate;
    task.category = category || task.category;
    task.status = status || task.status;
    task.recurrence = recurrence || task.recurrence;
    task.dependencies = dependencies || task.dependencies;  // Update dependencies field

    await task.save();
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a task's status, checking dependencies (PUT /api/tasks/:id/status)
router.put('/:id/status', protect, async (req, res) => {
  const { status } = req.body;

  try {
    const task = await Task.findById(req.params.id).populate('dependencies');  // Populate dependencies

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this task' });
    }

    // Check if all dependent tasks are completed
    const allDependenciesCompleted = task.dependencies.every(dep => dep.status === 'Completed');
    
    if (!allDependenciesCompleted) {
      return res.status(400).json({ message: 'Cannot mark task as completed until all dependent tasks are finished.' });
    }

    task.status = status;
    await task.save();
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a task (DELETE /api/tasks/:id)
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if the task belongs to the logged-in user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this task' });
    }

    // Use deleteOne to remove the task
    await task.deleteOne();
    
    res.status(200).json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get tasks that are due soon (within 24 hours) and haven't been notified yet
router.get('/due-soon', protect, async (req, res) => {
  const now = new Date();
  const next24Hours = new Date();
  next24Hours.setHours(next24Hours.getHours() + 24); // 24 hours from now

  try {
    const tasksDueSoon = await Task.find({
      user: req.user.id,
      dueDate: { $gte: now, $lte: next24Hours },
      status: 'Pending',
      notified: false,  // Get tasks that haven't been notified yet
    });

    res.status(200).json(tasksDueSoon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update task progress (PUT /api/tasks/:id/progress)
router.put('/:id/progress', protect, async (req, res) => {
  const { progress } = req.body;

  try {
    const task = await Task.findById(req.params.id);
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this task' });
    }

    task.progress = progress;
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
