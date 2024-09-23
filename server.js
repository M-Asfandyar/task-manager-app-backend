const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cron = require('node-cron');
const firebaseAdmin = require('firebase-admin');
const path = require('path');  // Add this to ensure path is handled correctly
const Task = require('./models/Task');
const User = require('./models/User');
const { protect } = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const { sendPushNotification } = require('./controllers/notificationController');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Load Firebase credentials from environment variable
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Initialize Firebase Admin SDK only if the serviceAccountPath is provided
if (serviceAccountPath) {
  try {
    const serviceAccount = require(path.resolve(serviceAccountPath));  // Dynamically load the JSON file
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin initialized');
  } catch (error) {
    console.error('Error loading Firebase Admin SDK:', error);
  }
} else {
  console.error('Firebase Admin credentials not found. Please set GOOGLE_APPLICATION_CREDENTIALS in .env');
}

// Middleware to parse JSON requests
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Root route
app.get('/', (req, res) => {
  res.send('Task Manager API');
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
connectDB();

// Authentication Routes
app.use('/api/auth', authRoutes);

// Task routes
app.use('/api/tasks', taskRoutes);

// Task recurrence logic (Daily, Weekly, Monthly reset)
cron.schedule('*/5 * * * *', async () => {  // Runs every 5 minutes
  try {
    const now = new Date();
    const recurringTasks = await Task.find({ recurrence: { $ne: 'None' }, status: 'Completed' });

    recurringTasks.forEach(async (task) => {
      let nextDueDate = new Date(task.dueDate);

      if (task.recurrence === 'Daily') {
        nextDueDate.setDate(nextDueDate.getDate() + 1);
      } else if (task.recurrence === 'Weekly') {
        nextDueDate.setDate(nextDueDate.getDate() + 7);
      } else if (task.recurrence === 'Monthly') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      if (nextDueDate <= now) {
        task.status = 'Pending';
        task.dueDate = nextDueDate;
        await task.save();
        console.log(`Recurring task "${task.title}" reset to pending.`);
      }
    });
  } catch (error) {
    console.error('Error handling recurring tasks:', error);
  }
});

// High-Priority Task Notifications
cron.schedule('*/5 * * * *', async () => {  // Runs every 5 minutes
  const now = new Date();
  const oneHourFromNow = new Date();
  oneHourFromNow.setHours(now.getHours() + 1);

  try {
    const highPriorityTasks = await Task.find({
      dueDate: { $gte: now, $lte: oneHourFromNow },
      priority: 'High',
      status: 'Pending',
      notified: false,
    });

    highPriorityTasks.forEach(async (task) => {
      const user = await User.findById(task.user);
      if (user && user.fcmToken) {
        sendPushNotification(user.fcmToken, `Task "${task.title}" is due soon.`);
      }
      task.notified = true;
      await task.save();
    });
  } catch (error) {
    console.error('Error sending high-priority notifications:', error);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
