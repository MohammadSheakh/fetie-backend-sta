import { Router } from 'express';
import auth from '../../middlewares/auth';
import { NotificationController } from './notification.controllers';

const router = Router();

router
  .route('/')
  .get(auth('common'), NotificationController.getALLNotification);

router.route('/today-notification')
.get(
  auth('common'),
  NotificationController.getAllNotificationAlongWithTodaysNotificationGeneratedByChatGpt);

router.route('/mark-all-read')
.get(
  auth('common'),
  NotificationController.markAllNotificationAsRead
)

export const NotificationRoutes = router;
