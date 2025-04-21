import express from 'express';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';

import auth from '../../../middlewares/auth';
import validateRequest from '../../../shared/validateRequest';
import * as validation   from './personalizeJourney.validation';
import { PersonalizedJourneyController } from './personalizeJourney.controller';
import { IPersonalizeJourney } from './personalizeJourney.interface';
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IPersonalizeJourney>(
  filters: T[]
) => {
  return filters;
};

// const taskService = new TaskService();
const controller = new PersonalizedJourneyController();

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
  auth('common'),
  validateRequest(validation.createPersonalizeJourneyValidationSchema),
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
router.route('/save-optional-information').post(
  // auth('common'),
  controller.saveOptionalInformation
)


export const PersonalizedJourneyRoute = router;
