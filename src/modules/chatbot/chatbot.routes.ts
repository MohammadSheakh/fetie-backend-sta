import express from 'express';
import auth from '../../middlewares/auth';
import { ChatBotV1Controller } from './chatbotV1.controller';
import { ChatBotTestController } from './chatbotTest.controller';

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
  // chatbotResponseLongPollingWithEmbeddingHistory
  .post(auth('common'), ChatBotV1Controller.chatbotResponseLongPolling_V2_Claude); // working perfectly ..


router
  .route('/bot/cycleInsight')
  .get(auth('common'), ChatBotV1Controller.getCycleInsightWithStramFalse);

router
  .route('/bot/createEmbeddingForTesingPurpose')
  .post(new ChatBotTestController().createEmbedding)

router
  .route('/bot/sendMessageToChatBotVector')
  .post(auth('common'), new ChatBotTestController().chatbotResponseLongPolHistoryVectorV2)

export const ChatBotRoute = router;


