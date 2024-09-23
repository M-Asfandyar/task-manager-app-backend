const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  dueDate: {
    type: Date,
    required: true, // Due date is required for scheduling
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending',
  },
  category: {
    type: String,
    enum: ['Work', 'Personal', 'Urgent'],
    required: true,
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',  // Reference to other tasks
  }],
  // Recurrence logic for handling daily, weekly, or monthly tasks
  recurrence: {
    type: String,
    enum: ['None', 'Daily', 'Weekly', 'Monthly'],
    default: 'None',
  },
  // Track if a notification has already been sent for this task
  notified: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
