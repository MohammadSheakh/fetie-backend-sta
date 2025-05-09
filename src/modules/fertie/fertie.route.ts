import express from 'express';
import { validateFiltersForQuery } from '../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import auth from '../../middlewares/auth';
import validateRequest from '../../shared/validateRequest';
import { FertieController } from './fertie.controller';
import { IFertie } from './fertie.interface';

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();

export const optionValidationChecking = <T extends keyof IFertie>(
  filters: T[]
) => {
  return filters;
};

// const taskService = new TaskService();
const controller = new FertieController();

//info : pagination route must be before the route with params
router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id'])),
  controller.getAllWithPagination
);

// router.route('/:id').get(
//   // auth('common'),
//   controller.getById
// );

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

////////////
router.route('/get-home-page-data').get(
  // -home-page-data
  auth('common'),
  controller.getHomePageDataByDate
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router
  .route('/predictions')
  .get(auth('common'), controller.getPredictionsByMonth); // ?month=YYYY-MM

  // 🔥 jhamela ase .. logged in user er jonno develop korte hobe .. may be lagbeo na ei endpoint
router
  .route('/daily-insights')
  .get(auth('common'), controller.getMonthlyDailyCycleInsightsByMonth); // ?month=YYYY-MM

  // 🔥 jhamela ase .. logged in user er jonno develop korte hobe .. may be lagbeo na ei endpoint
  router
  .route('/daily-insights-daily')
  .get(auth('common'), controller.getDailyDailyCycleInsightsByDate); // ?date=YYYY-MM-DD


  
export const FertieRoute = router;
