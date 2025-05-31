import admin from '../config/firebaseConfig';
import { IUser } from '../modules/user/user.interface';

const sendPushNotification = async (
  user : Partial<IUser>, 
  data : {
    title: string;
    content: string;
  }
) => {
  const message = {
    notification: {
      title: data.title,
      body: data.content,
    },
    token: user.fcmToken, // Ensure the user has a valid FCM token
  };

  console.log('Sending push notification to: 🫸🔔', user.email);

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent  push notification:', response);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

export default sendPushNotification;