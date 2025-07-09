import express from 'express';
import { UserController } from './user.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../shared/validateRequest';
import { UserValidation } from './user.validation';
import fileUploadHandler from '../../shared/fileUploadHandler';
import convertHeicToPngMiddleware from '../../shared/convertHeicToPngMiddleware';
import { IUser } from './user.interface';
import { validateFiltersForQuery } from '../../middlewares/queryValidation/paginationQueryValidationMiddleware';
const UPLOADS_FOLDER = 'uploads/users';
const upload = fileUploadHandler(UPLOADS_FOLDER);

const router = express.Router();

export const optionValidationChecking = <T extends keyof IUser>(
  filters: T[]
) => {
  return filters;
};


//info : pagination route must be before the route with params
//[🚧][🧑‍💻][🧪] // ✅ 🆗
//💹📈 need scalability .. like mongo db indexing .. 
/*
 🚧 // TODO: name and email er jonno regex add korte hobe ..  
*/
router.route('/paginate').get(
  auth('commonAdmin'),
 validateFiltersForQuery(optionValidationChecking(['_id', 'name', 'email', 'subscriptionType', 'status', 'role'])),
  UserController.getAllUserForAdminDashboard
);

//[🚧][🧑‍💻][🧪] // ✅ 🆗
router.route('/paginate/admin').get(
  auth('commonAdmin'),
 validateFiltersForQuery(optionValidationChecking(['_id', 'name', 'email', 'role', 'status', 'createdAt'])),
  UserController.getAllAdminForAdminDashboard
);

//[🚧][🧑‍💻][🧪] // ✅ 🆗
router.post(
  "/send-invitation-link-to-admin-email",
  auth('superAdmin'),
  validateRequest(UserValidation.sendInvitationToBeAdminValidationSchema),
  UserController.sendInvitationLinkToAdminEmail
);

/**
 * 
 * Access Pin Related End Points 
 */

// set new pin
router.post('/access-pin/set-new', 
  auth('common'),
  validateRequest(UserValidation.createAccessPinCodeValidationSchema),
  UserController.setNewAccessPin
)

/**
 * remove pin totally
 */

router.post('/access-pin/remove-pin', 
  auth('common'),
  validateRequest(UserValidation.createAccessPinCodeValidationSchema),
  UserController.removeAccessPin
)

/**
 * 
 * Change Current Pin code  
 */

router.post('/access-pin/give-permission-to-change-current-pin', 
  auth('common'),
  validateRequest(UserValidation.createAccessPinCodeValidationSchema),
  UserController.givePermissionToChangeCurrentPin
)

/**
 * 
 * Match Access Pin
 */
router.post('/access-pin/match',
  auth('common'),
  validateRequest(UserValidation.createAccessPinCodeValidationSchema),
  UserController.matchAccessPin
) 

// TODO:  Forgot Pin and Verify Email Develop korte hobe .. access Pin related 

/*************************
 * 
 * // Risky .. If you pass collectionName as a parameter, it will delete all data from that collection.
 * 
 * ********************* */
router.post('/delete/:collectionName',
  auth('common'), // TODO : Must superAdmin e change korte hobe .. 
  UserController.deleteAllDataFromCollection
) 

//[🚧][🧑‍💻✅][🧪🆗] // query :: userId
router.get('/status/change',
  auth('commonAdmin'),
  UserController.changeUserStatus
)

//[🚧][🧑‍💻✅][🧪🆗] // query :: userId
router.get('/subscriptionType/change',
  auth('commonAdmin'),
  UserController.changeUserSubscriptionType
)

////////////////////////////////////////////////

//[🚧][🧑‍💻✅][🧪🆗] //  

router
  .route('/profile-image')
  .post(
    auth('common'),
    upload.single('profile_image'),
    convertHeicToPngMiddleware(UPLOADS_FOLDER),
    UserController.updateProfileImage
  );

// sub routes must be added after the main routes
//[🚧][🧑‍💻✅][🧪🆗]
router
  .route('/profile')
  .get(auth('common'), UserController.getMyProfile) // 🟢
  .patch(
    auth('common'),
    validateRequest(UserValidation.updateUserValidationSchema),
    upload.single('profile_image'),
    convertHeicToPngMiddleware(UPLOADS_FOLDER),
    UserController.updateMyProfile
  )
  .delete(auth('common'), UserController.deleteMyProfile);

router.route('/profile/requiredField').get(auth('common'), UserController.getMyProfileOnlyRequiredField);

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
  

export const UserRoutes = router;
