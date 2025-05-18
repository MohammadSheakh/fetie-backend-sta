import express from 'express';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import { ISubscriptionPlan } from './subscriptionPlan.interface';
import { SubscriptionController } from './subscriptionPlan.controller';
import auth from '../../../middlewares/auth';
import validateRequest from '../../../shared/validateRequest';
import * as validation from './subscriptionPlan.validation';

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof ISubscriptionPlan>(filters: T[]) => {
  return filters;
};

// const taskService = new TaskService();
const controller = new SubscriptionController();

//info : pagination route must be before the route with params
router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id'])),
  controller.getAllWithPagination 
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/subscribe-from-back-end').get(
  auth('common'), // FIXME: authentication lagbe .. 
  validateRequest(validation.subscribeFromBackEndValidationSchema),
  controller.subscribeFromBackEnd 
);

router.route('/subscribe-from-front-end').get(
  auth('common'), // FIXME: authentication lagbe .. 
  validateRequest(validation.subscribeFromFrontEndValidationSchema),
  // controller.subscribeFromFrontEnd // 🔴🔴 
  controller.subscribeFromFrontEndV2 // 🟢
);

router.route("/confirm-payment").get(
  controller.confirmPayment
)

router.route('/payment-success').get(
  controller.paymentSuccess
)


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

/**
 *  this api is for creating subscription plan form admin dashboard .. 
 *
 */
//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/create').post(
  // [
  //   upload.fields([
  //     { name: 'attachments', maxCount: 15 }, // Allow up to 5 cover photos
  //   ]),
  // ],
  //auth('common'),
  validateRequest(validation.createSubscriptionPlanValidationSchema),
  controller.create
);

router
  .route('/delete/:id')
  .delete(
    //auth('common'),
    controller.deleteById); // FIXME : change to admin

router
.route('/softDelete/:id')
.put(
  //auth('common'),
  controller.softDeleteById);


 ////////////
 


router.route('/customerPortal/:customerId').get(
  auth('common'), 
  controller.customerPortal
)

router.route('/webhook').post(
  express.raw({ type: 'application/json' }),
  //auth('common'),
  controller.webhook
);

export const SubscriptionPlanRoute = router;
