import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import pick from '../../shared/pick';
import sendResponse from '../../shared/sendResponse';
import ApiError from '../../errors/ApiError';
import { UserCustomService, UserService } from './user.service';
import { User } from './user.model';
import { Types } from 'mongoose';
import { TokenService } from '../token/token.service';
import { sendAdminOrSuperAdminCreationEmail } from '../../helpers/emailService';
import { AuthService } from '../auth/auth.service';

const userCustomService = new UserCustomService();



const createAdminOrSuperAdmin = catchAsync(async (req, res) => {
  const payload = req.body;
  const result = await UserService.createAdminOrSuperAdmin(payload);
  sendResponse(res, {
    code: StatusCodes.CREATED,
    data: result,
    message: `${
      payload.role === 'admin' ? 'Admin' : 'Super Admin'
    } created successfully`,
  });
});




//get single user from database
const getSingleUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await UserService.getSingleUser(userId);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User fetched successfully',
  });
});

//update profile image
const updateProfileImage = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  if (req.file) {
    req.body.profile_image = {
      imageUrl: '/uploads/users/' + req.file.filename,
      file: req.file,
    };
  }
  const result = await UserService.updateMyProfile(userId, req.body);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'Profile image updated successfully',
  });
});

//update user from database
const updateMyProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  if (req.file) {
    req.body.profile_image = {
      imageUrl: '/uploads/users/' + req.file.filename,
      file: req.file,
    };
  }
  const result = await UserService.updateMyProfile(userId, req.body);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User updated successfully',
  });
});

//update user status from database
const updateUserStatus = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const payload = req.body;
  const result = await UserService.updateUserStatus(userId, payload);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User status updated successfully',
  });
});

//update user
const updateUserProfile = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const payload = req.body;
  const result = await UserService.updateUserProfile(userId, payload);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User updated successfully',
  });
});

//get my profile //[🚧][🧑‍💻✅][🧪🆗]
const getMyProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  const result = await UserService.getMyProfile(userId);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User fetched successfully',
  });
});
//delete user from database
const deleteMyProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  const result = await UserService.deleteMyProfile(userId);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User deleted successfully',
  });
});


//////////////////////////////////////////////////////////

//[🚧][🧑‍💻][🧪] // ✅ 🆗
const getAllUserForAdminDashboard = catchAsync(async (req, res) => {
  const filters = req.query;
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const result = await userCustomService.getAllWithPagination(filters, options);

  sendResponse(res, {
    code: StatusCodes.OK,
    data: result, 

    message: 'All users fetched successfully',
  });
}
);

//[🚧][🧑‍💻][🧪] // ✅ 🆗
const getAllAdminForAdminDashboard = catchAsync(async (req, res) => {
  // const filters = req.query;

  const filters = { ...req.query };
  
  // If role is not specified in query, set default to show both admin and superAdmin
  if (!filters.role) {
    filters.role = { $in: ['admin', 'superAdmin'] };
  }

  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

  const result = await userCustomService.getAllWithPagination(filters, options);

  sendResponse(res, {
    code: StatusCodes.OK,
    data: result, 
    message: 'All admin fetched successfully',
  });
}
);


//[🚧][🧑‍💻][🧪] // ✅ 🆗 // 🧪🧪🧪🧪🧪🧪🧪🧪🧪 need test 
// send Invitation Link for a admin
const sendInvitationLinkToAdminEmail = catchAsync(async (req, res) => {
  const user = await UserService.getUserByEmail(req.body.email);

  /**
   * 
   * req.body.email er email jodi already taken 
   * if ----
   * then we check isEmailVerified .. if false .. we make that true 
   * 
   * if isDeleted true then we make it false 
   * 
   * else ---
   *  we create new admin and send email
   * 
   */

  if(user && user.isEmailVerified === true){
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already taken');
  }
  else if(user && user.isDeleted === true){
    user.isDeleted = false;
    await user.save();
  }
  else if(user && user.isEmailVerified === false){
    user.isEmailVerified = true;
    await user.save();
    const token = await TokenService.createVerifyEmailToken(user);
    await sendAdminOrSuperAdminCreationEmail(
      req?.body?.email,
      req.body.role,
      req?.body?.password,
      req.body.message ?? "welcome to the team"
    );

    return sendResponse(res, {
      code: StatusCodes.OK,
      data: null,
      message: 'User already found and Invitation link sent successfully for admin',
    });
  }else{
    // create new user 
    if(req.body.role == "admin")
      {
        const newUser = await AuthService.createUser({
          email: req.body.email,
          password: req.body.password,
          role: req.body.role,
          isEmailVerified: true,
        });

        return sendResponse(res, {
          code: StatusCodes.OK,
          data: null,
          message: 'New admin created and invitation link sent successfully',
        });
      } 
  }

});

const setNewAccessPin = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  const { accessPinCode } = req.body;
  if (!accessPinCode) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Access Pin Code is required');
  }

  // TODO :  We need to hash the access pin code before saving it to the database .. 

  const result = await UserService.setNewAccessPin(userId, accessPinCode);

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'Access Pin Code updated successfully',
  });
});

const removeAccessPin = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }

  const result = await UserService.removeAccessPin(userId, req.body.accessPinCode);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Access Pin can not be removed');
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'Access Pin Code removed successfully',
  });
});



export const UserController = {
  createAdminOrSuperAdmin,
  getSingleUser,
  updateMyProfile,
  updateProfileImage,
  updateUserStatus,
  getMyProfile,
  updateUserProfile,
  deleteMyProfile,
  //////////////////////////
  getAllUserForAdminDashboard,
  getAllAdminForAdminDashboard,
  sendInvitationLinkToAdminEmail,

  ////////////// Access Pin Related Controller ////////
  setNewAccessPin,
  removeAccessPin
  ///////////////////////////////////////////////////
};
