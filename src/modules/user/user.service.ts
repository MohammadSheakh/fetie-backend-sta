import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import { PaginateOptions, PaginateResult } from '../../types/paginate';
import { IUser, TUser } from './user.interface';
import { User } from './user.model';
import { sendAdminOrSuperAdminCreationEmail } from '../../helpers/emailService';

import { GenericService } from '../__Generic/generic.services';

interface IAdminOrSuperAdminPayload {
  email: string;
  password: string;
  role: string;
  message?: string;
}

export class UserCustomService extends GenericService<typeof User, IUser> {
  constructor() {
    super(User);
  }

  
}

//[🚧][🧑‍💻][🧪] // ✅ 🆗
const getUserByEmail = async (email: string) : Promise<TUser | null>  => {
  return User.findOne({ email });
};

const createAdminOrSuperAdmin = async (
  payload: IAdminOrSuperAdminPayload
): Promise<TUser> => {
  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'This email already exists');
  }
  const result = new User({
    first_name: 'New',
    last_name: ` ${payload.role === 'admin' ? 'Admin' : 'Super Admin'}`,
    email: payload.email,
    password: payload.password,
    role: payload.role,
  });

  await result.save();
  //send email for the new admin or super admin via email service
  // todo
  sendAdminOrSuperAdminCreationEmail(
    payload.email,
    payload.role,
    payload.password,
    payload.message
  );

  return result;
};

const getAllUsers = async (
  filters: Record<string, any>,
  options: PaginateOptions
): Promise<PaginateResult<TUser>> => {
  const query: Record<string, any> = {};
  if (filters.userName) {
    query['first_name'] = { $regex: filters.userName, $options: 'i' };
  }
  if (filters.email) {
    query['email'] = { $regex: filters.email, $options: 'i' };
  }
  if (filters.role) {
    query['role'] = filters.role;
  }
  return await User.paginate(query, options);
};



const getSingleUser = async (userId: string): Promise<TUser | null> => {
  const result = await User.findById(userId);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return result;
};

const updateMyProfile = async (
  userId: string,
  payload: Partial<TUser>
): Promise<TUser | null> => {
  const result = await User.findByIdAndUpdate(userId, payload, { new: true });
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return result;
};

const updateUserStatus = async (
  userId: string,
  payload: Partial<TUser>
): Promise<TUser | null> => {
  const result = await User.findByIdAndUpdate(userId, payload, { new: true });
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return result;
};
const updateUserProfile = async (
  userId: string,
  payload: Partial<TUser>
): Promise<TUser | null> => {
  const result = await User.findByIdAndUpdate(userId, payload, { new: true });
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return result;
};

const updateProfileImage = async (
  userId: string,
  payload: Partial<TUser>
): Promise<TUser | null> => {
  const result = await User.findByIdAndUpdate(userId, payload, { new: true });
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return result;
};

//[🚧][🧑‍💻✅][🧪🆗]
const getMyProfile = async (userId: string): Promise<TUser | null> => {
  const result = await User.findById(userId);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return result;
};
const deleteMyProfile = async (userId: string): Promise<TUser | null> => {
  const result = await User.findById(userId);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  result.isDeleted = true;
  await result.save();
  return result;
};

const setNewAccessPin = async (userId: string, accessPinCode : string) => {
  const result = await User.findByIdAndUpdate(
    userId,
    { accessPinCode },
    { new: true }
  );
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Database error which updating accessPinCode');
  }
  return result;
}

const removeAccessPin = async (userId: string, accessPinCode : string) => {

  const result = await User.findById(userId);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Database error while remove access pin code because user is not found ');
  }

  if(!result.accessPinCode){
    throw new ApiError(StatusCodes.NOT_FOUND, 'Access pin code not found');
  }

  console.log("result.accessPinCode", result.accessPinCode, "type of ", typeof result.accessPinCode);
  console.log("accessPinCode", accessPinCode , "type of ", typeof accessPinCode);
  
  if(result.accessPinCode !== accessPinCode){
    throw new ApiError(StatusCodes.NOT_FOUND, 'Access pin is not matched, You can not remove access pin code ');
  }

  if(result.accessPinCode){
    result.accessPinCode = "";
    await result.save();
  }

  return result;
}

const givePermissionToChangeCurrentPin = async (userId: string, accessPinCode : string) => {
  const result = await User.findById(userId);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Database error which updating accessPinCode');
  }
  if(!result.accessPinCode){
    throw new ApiError(StatusCodes.NOT_FOUND, 'Access pin code not found');
  }
  if(result.accessPinCode !== accessPinCode){
    throw new ApiError(StatusCodes.NOT_FOUND, 'Access pin is not matched, You can not change access pin code ');
  }
  result.accessPinCode = "";
  await result.save();
  return result;
}

const matchAccessPin = async (userId: string, accessPinCode : string) => {
  const result = await User.findById(userId);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Database error while finding user');
  }
  if(!result.accessPinCode){
    throw new ApiError(StatusCodes.NOT_FOUND, 'Access pin code not found of this user');
  }
  if(result.accessPinCode !== accessPinCode){
    throw new ApiError(StatusCodes.NOT_FOUND, 'Access pin is not matched, try again');
  }
  return result;
}

///////////////////////////////////////////////////////

export const UserService = {
  ///////////// Admin Related Service ///////////
  createAdminOrSuperAdmin,
  getAllUsers,

  /////////////////////////////////////////////////
  getSingleUser,
  updateMyProfile,
  updateUserStatus,
  updateUserProfile,
  getMyProfile,
  updateProfileImage,
  deleteMyProfile,
  getUserByEmail,
  ///////////////  Access pin Related Service ///////////
  setNewAccessPin,
  removeAccessPin,
  givePermissionToChangeCurrentPin,
  matchAccessPin
};
