import express from 'express';

import { ChatBotController } from './chatbot.controller';
import auth from '../../middlewares/auth';
import { ChatBotV0Controller } from './chatbotV0.controller';

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

// export const optionValidationChecking = <T extends keyof IOrder>(
//   filters: T[]
// ) => {
//   return filters;
// };

router.route('/bot').post(auth('common'), ChatBotV0Controller.chatbotResponseV1);

export const ChatBotRoute = router;
