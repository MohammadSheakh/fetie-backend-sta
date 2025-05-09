import moment from 'moment';
import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { OtpService } from '../otp/otp.service';
import { User } from '../user/user.model';
import bcryptjs from 'bcryptjs';
import { TUser } from '../user/user.interface';
import { config } from '../../config';
import { TokenService } from '../token/token.service';
import { TokenType } from '../token/token.interface';
import { OtpType } from '../otp/otp.interface';
import { TAuthProvider } from '../user/user.constant';

const validateUserStatus = (user: TUser) => {
  if (user.isDeleted) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Your account has been deleted. Please contact support',
    );
  }
};
const createUser = async (userData: Partial<TUser>) => {
  // if(userData.role == 'projectSupervisor'){
  //   if(userData.superVisorsManagerId == null){
  //     throw new ApiError(StatusCodes.BAD_REQUEST, 'SuperVisor Manager Id is required');
  //   }
  // }else{
  //   userData.superVisorsManagerId = null;
  // }

   // Check if the user is registering via Google or Apple
   if (userData.authProvider === 'google') {
    const existingUser = await User.findOne({ googleId: userData.googleId });
    if (existingUser) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Google account already linked');
    }
  }

  if (userData.authProvider === 'apple') {
    const existingUser = await User.findOne({ appleId: userData.appleId });
    if (existingUser) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Apple account already linked');
    }
  }

  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    if (existingUser.isEmailVerified) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already taken');
    } else {
      
      userData.authProvider = TAuthProvider.local;
      
      await User.findOneAndUpdate({ email: userData.email }, userData);

      //create verification email token
      const verificationToken =
        await TokenService.createVerifyEmailToken(existingUser);
      //create verification email otp
      await OtpService.createVerificationEmailOtp(existingUser.email);



      return { verificationToken };
    }
  }

  userData.authProvider = TAuthProvider.local;

  const user = await User.create(userData);
  // cantunderstand :  
  //create verification email token
  const verificationToken = await TokenService.createVerifyEmailToken(user);
  //create verification email otp
  const {otp} = await OtpService.createVerificationEmailOtp(user.email);
  return { user, verificationToken }; // FIXME  : otp remove korte hobe ekhan theke .. 
};

const handleSocialLogin = async (user, fcmToken) => {
  const tokens = await TokenService.accessAndRefreshToken(user);

  if (fcmToken) {
    user.fcmToken = fcmToken;
    await user.save(); // Save FCM token if provided
  }

  const { password, ...userWithoutPassword } = user.toObject();

  return {
    userWithoutPassword,
    tokens,
  };
};

const login = async (email: string, reqpassword: string, fcmToken : string) => {


  const user = await User.findOne({ email }).select('+password');



  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }


  if (user.authProvider != TAuthProvider.local) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Authorization failed .... ');
  }

  validateUserStatus(user);

  // if (!user.isEmailVerified) {
  //   //create verification email token
  //   const verificationToken = await TokenService.createVerifyEmailToken(user);
  //   //create verification email otp
  //   await OtpService.createVerificationEmailOtp(user.email);
  //   return { verificationToken };

  //   throw new ApiError(
  //     StatusCodes.BAD_REQUEST,
  //     'User not verified, Please verify your email, Check your email.'
  //   );
  // }

  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new ApiError(
      StatusCodes.TOO_MANY_REQUESTS,
      `Account is locked. Try again after ${config.auth.lockTime} minutes`,
    );
  }

  const isPasswordValid = await bcryptjs.compare(reqpassword, user.password);
  if (!isPasswordValid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= config.auth.maxLoginAttempts) {
      user.lockUntil = moment().add(config.auth.lockTime, 'minutes').toDate();
      await user.save();
      throw new ApiError(
        423,
        `Account locked for ${config.auth.lockTime} minutes due to too many failed attempts`,
      );
    }
    // user.fcmToken = fcmToken;

    await user.save();
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  if (user.failedLoginAttempts > 0) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }

  const tokens = await TokenService.accessAndRefreshToken(user);

  if(fcmToken){
    user.fcmToken = fcmToken;
    await user.save();  // INFO :  ekhane fcmToken save kora hocche 
  }

  const { password, ...userWithoutPassword } = user.toObject();

  return {
    userWithoutPassword,
    tokens,
  };
};

//[🚧][🧑‍💻✅][🧪]  // 🆗
const verifyEmail = async (email: string, token: string, otp: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  await TokenService.verifyToken(
    token,
    config.token.TokenSecret,
    user?.isResetPassword ? TokenType.RESET_PASSWORD : TokenType.VERIFY,
  );

  //verify otp
  await OtpService.verifyOTP(
    user.email,
    otp,
    user?.isResetPassword ? OtpType.RESET_PASSWORD : OtpType.VERIFY,
  );

  user.isEmailVerified = true;
  await user.save();

  const tokens = await TokenService.accessAndRefreshToken(user);
  return {user, tokens} ;
};

const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  //create reset password token
  const resetPasswordToken = await TokenService.createResetPasswordToken(user);
  await OtpService.createResetPasswordOtp(user.email);
  user.isResetPassword = true;
  await user.save();
  return { resetPasswordToken };
};

const resendOtp = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (user?.isResetPassword) {
    const resetPasswordToken =
      await TokenService.createResetPasswordToken(user);
      await OtpService.createResetPasswordOtp(user.email);
    return { resetPasswordToken };
  }
  const verificationToken = await TokenService.createVerifyEmailToken(user);
  await OtpService.createVerificationEmailOtp(user.email);
  return { verificationToken };
};

const resetPassword = async (
  email: string,
  newPassword: string,
  otp: string,
) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  await OtpService.verifyOTP(
    user.email,
    otp,
    user?.isResetPassword ? OtpType.RESET_PASSWORD : OtpType.VERIFY,
  );
  user.password = newPassword;
  user.isResetPassword = false;
  await user.save();
  const { password, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
};

const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  const { password, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
};
const logout = async (refreshToken: string) => {};

const refreshAuth = async (refreshToken: string) => {};

export const AuthService = {
  createUser,
  login,
  verifyEmail,
  resetPassword,
  forgotPassword,
  resendOtp,
  logout,
  changePassword,
  refreshAuth,
  handleSocialLogin
};
