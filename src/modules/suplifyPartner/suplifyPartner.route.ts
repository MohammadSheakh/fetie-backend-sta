import express from 'express';
import auth from '../../middlewares/auth';
import { SuplifyPartnerController } from './suplifyPartner.controller';
import {  validateFiltersForQuery } from '../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import { ISuplifyPartner } from './suplifyPartner.interface';
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof ISuplifyPartner>(filters: T[]) => {
  return filters;
};

// const taskService = new TaskService();
const suplifyPartnerController = new SuplifyPartnerController();

//info : pagination route must be before the route with params
router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id', 'partnerName'])),
  suplifyPartnerController.getAllWithPagination 
);

router.route('/:id').get(
  // auth('common'),
  suplifyPartnerController.getById 
);

router.route('/update/:taskId').put(
  //auth('common'), // FIXME: Change to admin
  // validateRequest(UserValidation.createUserValidationSchema),
  suplifyPartnerController.updateById
);

router.route('/').get(
  //auth('common'), // FIXME: maybe authentication lagbe na .. 
  suplifyPartnerController.getAll 
);

router.route('/create').post(
  // [
  //   upload.fields([
  //     { name: 'attachments', maxCount: 15 }, // Allow up to 5 cover photos
  //   ]),
  // ],
  //auth('common'),
  // validateRequest(UserValidation.createUserValidationSchema),
  suplifyPartnerController.create
);

router
  .route('/delete/:id')
  .delete(
    //auth('common'),
     suplifyPartnerController.deleteById); // FIXME : change to admin

router
.route('/softDelete/:id')
.put(
  //auth('common'),
  suplifyPartnerController.softDeleteById);

export const SuplifyPartnerRoute = router;
