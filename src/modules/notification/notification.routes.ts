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

export const NotificationRoutes = router;
