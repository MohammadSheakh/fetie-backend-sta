import express from 'express';
import { DailyCycleInsightsController } from './dailyCycleInsights.controller';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import { IDailyCycleInsights } from './dailyCycleInsights.interface';
import auth from '../../../middlewares/auth';
import * as dailyCycleInsightsValidation from './dailyCycleInsights.validation';
import validateRequest from '../../../shared/validateRequest';

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();

export const optionValidationChecking = <T extends keyof IDailyCycleInsights>(
  filters: T[]
) => {
  return filters;
};

// const taskService = new TaskService();
const controller = new DailyCycleInsightsController();

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

router.route('/create').post(
  // [
  //   upload.fields([
  //     { name: 'attachments', maxCount: 15 }, // Allow up to 5 cover photos
  //   ]),
  // ],
  auth('common'),

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


router
  .route('/update-by-date')
  .patch(
    auth('common'),
    validateRequest(
      dailyCycleInsightsValidation.createDailyCycleInsightsValidationSchema
    ),
    controller.updateByDate
  );

// 🔴🔴 not working ..  
router.route('/get-by-date').get(auth('common'), controller.getByDateAndUserId);

export const DailyCycleInsightsRoute = router;
