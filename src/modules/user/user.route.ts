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

const paginationOptions: Array<'sortBy' | 'page' | 'limit' | 'populate'> = [
  'sortBy',
  'page',
  'limit',
  'populate',
];

export const optionValidationChecking = <T extends keyof IUser  | 'sortBy' | 'page' | 'limit' | 'populate'>(
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
 validateFiltersForQuery(optionValidationChecking(['_id', 'name', 'email', 'subscriptionType', 'status', 'role', ...paginationOptions])),
  UserController.getAllUserForAdminDashboard
);

// sub routes must be added after the main routes
//[🚧][🧑‍💻✅][🧪🆗]
router
  .route('/profile')
  .get(auth('common'), UserController.getMyProfile) // 🟢
  .delete(auth('common'), UserController.deleteMyProfile);

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


  /*************************
 * // Working Perfectly .. 
 * // (App) | Customer , User | Upload profile image ... 
 * 🚫🚫🚫🚫 Issue ase .. 
 * ********************* */
router
.route('/profile-image')
.put(
  auth('common'),
  [upload.single('profileImage')],
  UserController.updateProfileImage
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
  // auth('common'), // TODO : Must superAdmin e change korte hobe .. 
  UserController.deleteAllDataFromCollection
) 

//[🚧][🧑‍💻✅][🧪🆗] // query :: userId
router.post('/status/change',
  auth('commonAdmin'),
  UserController.changeUserStatus
)

//[🚧][🧑‍💻✅][🧪🆗] // query :: userId
router.post('/subscriptionType/change',
  auth('commonAdmin'),
  UserController.changeUserSubscriptionType
)

////////////////////////////////////////////////



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




/**
 * App: Under Profile Section User Module Related End Points 
 *
 */

router
.route('/profile')
.put(
  auth('common'),
  UserController.updateProfile
);


  ///////////////////////////////////////////////
  

export const UserRoutes = router;
