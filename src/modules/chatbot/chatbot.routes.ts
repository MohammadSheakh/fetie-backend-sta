import express from 'express';

import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import { OrderController } from './order.controller';
import { IOrder } from './order.interface';
import { ChatBotController } from './chatbot.controller';
import auth from '../../middlewares/auth';

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IOrder>(
  filters: T[]
) => {
  return filters;
};

router.route('/bot').post(auth('common'), ChatBotController.chatbotResponse);

export const ChatBotRoute = router;
