const firebaseAdmin = require('firebase-admin');

// Function to send push notification
const sendPushNotification = async (fcmToken, message) => {
  const notification = {
    token: fcmToken,
    notification: {
      title: 'Task Reminder',
      body: message,
    },
  };

  try {
    await firebaseAdmin.messaging().send(notification);
    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

module.exports = {
  sendPushNotification,
};
