import express from 'express';
import { UserController } from './user.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../shared/validateRequest';
import { UserValidation } from './user.validation';
import fileUploadHandler from '../../shared/fileUploadHandler';
import convertHeicToPngMiddleware from '../../shared/convertHeicToPngMiddleware';
const UPLOADS_FOLDER = 'uploads/users';
const upload = fileUploadHandler(UPLOADS_FOLDER);

const router = express.Router();


//info : pagination route must be before the route with params
router.route('/paginate').get(
  auth('projectManager'),
  UserController.getAllUserWithPagination
);



//[🚧][🧑‍💻✅][🧪🆗] //  
// get all Projects by User Id  // :userId
router.route('/projects').get(auth('common'),
UserController.getAllProjectsByUserId
);

router
  .route('/profile-image')
  .post(
    auth('common'),
    upload.single('profile_image'),
    convertHeicToPngMiddleware(UPLOADS_FOLDER),
    UserController.updateProfileImage
  );
// sub routes must be added after the main routes
router
  .route('/profile')
  .get(auth('common'), UserController.getMyProfile)
  .patch(
    auth('common'),
    validateRequest(UserValidation.updateUserValidationSchema),
    upload.single('profile_image'),
    convertHeicToPngMiddleware(UPLOADS_FOLDER),
    UserController.updateMyProfile
  )
  .delete(auth('common'), UserController.deleteMyProfile);

//main routes
router.route('/').get(auth('common'), UserController.getAllUsers);

router
  .route('/:userId')
  .get(auth('common'), UserController.getSingleUser)
  .put(
    auth('common'),
    validateRequest(UserValidation.updateUserValidationSchema),
    UserController.updateUserProfile
  )
  .patch(
    auth('admin'),
    validateRequest(UserValidation.changeUserStatusValidationSchema),
    UserController.updateUserStatus
  );

  ///////////////////////////////////////////////

  router.get
  

export const UserRoutes = router;
