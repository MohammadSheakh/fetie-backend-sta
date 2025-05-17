import express from 'express';
import auth from '../../middlewares/auth';
import { ChatBotV1Controller } from './chatbotV1.controller';

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

// export const optionValidationChecking = <T extends keyof IOrder>(
//   filters: T[]
// ) => {
//   return filters;
// };

router
  .route('/bot/long-polling-with-history')
  .post(auth('common'), ChatBotV1Controller.chatbotResponseLongPollingWithHistory); // working perfectly .. 

router
  .route('/bot/cycleInsight')
  .get(auth('common'), ChatBotV1Controller.getCycleInsight);

export const ChatBotRoute = router;
