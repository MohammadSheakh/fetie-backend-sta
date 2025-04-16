import { Router } from 'express';
import auth from '../../middlewares/auth';
import { AdminController } from './admin.controller';
import fileUploadHandler from '../../shared/fileUploadHandler';

const router = Router();

const UPLOADS_FOLDER = 'uploads/users';
const upload = fileUploadHandler(UPLOADS_FOLDER);

//upload csv file user to User model

router
  .route('/upload-csv')
  .post(
    auth('admin', 'super_admin'),
    upload.single('csv_file'),
    AdminController.uploadCsvUsersFromNewUserModel
  );

export const AdminRoutes = router;
