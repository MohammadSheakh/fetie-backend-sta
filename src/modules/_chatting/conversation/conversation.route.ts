import express from 'express';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import { ConversationController } from './conversation.controller';
import { IConversation } from './conversation.interface';
import auth from '../../../middlewares/auth';
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IConversation>(
  filters: T[]
) => {
  return filters;
};

// const taskService = new TaskService();
const controller = new ConversationController();

//info : pagination route must be before the route with params
router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id'])),
  controller.getAllWithPagination
);

router.route('/:id').get(
  // auth('common'),
  controller.getById
);

router.route('/update/:id').put(
  //auth('common'), // FIXME: Change to admin
  // validateRequest(UserValidation.createUserValidationSchema),
  controller.updateById
);

router.route('/').get(
  //auth('common'), // FIXME: maybe authentication lagbe na ..
  controller.getAll
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/create').post(
  // [
  //   upload.fields([
  //     { name: 'attachments', maxCount: 15 }, // Allow up to 5 cover photos
  //   ]),
  // ],
  auth('user'),
  // validateRequest(UserValidation.createUserValidationSchema),
  controller.create
);

router.route('/delete/:id').delete(
  //auth('common'),
  controller.deleteById
); // FIXME : change to admin

router.route('/softDelete/:id').put(
  //auth('common'),
  controller.softDeleteById
);

////////////
//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/participants/add').post(
  // [
  //   upload.fields([
  //     { name: 'attachments', maxCount: 15 }, // Allow up to 5 cover photos
  //   ]),
  // ],
  auth('user'),
  // validateRequest(UserValidation.createUserValidationSchema),
  controller.addParticipantsToExistingConversation
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/participants/remove').delete(
  auth('user'),
  // validateRequest(UserValidation.createUserValidationSchema),
  controller.removeParticipantFromAConversation
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/participants/all').get(
  //auth('common'),
  controller.showParticipantsOfExistingConversation
);

export const ConversationRoute = router;
