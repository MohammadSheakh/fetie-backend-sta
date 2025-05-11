import express from 'express';
import auth from '../../middlewares/auth';
import { ChatBotV0Controller } from './chatbotV0.controller';
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
  .route('/bot')
  .post(auth('common'), ChatBotV0Controller.chatbotResponseV3ClaudeStreaming);

router
  .route('/bot/socket')
  .post(
    auth('common'),
    ChatBotV1Controller.chatbotResponseV5
  );

export const ChatBotRoute = router;
