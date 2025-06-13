import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { AuthService } from './auth.service';
import { User } from '../user/user.model';
import { TokenService } from '../token/token.service';
import { TAuthProvider } from '../user/user.constant';

//[🚧][🧑‍💻✅][🧪] // 🆗 
const register = catchAsync(async (req, res) => {
  const result = await AuthService.createUser(req.body);
  sendResponse(res, {
    code: StatusCodes.CREATED,
    message: 'User created successfully, please verify your email',
    data: result,
    success: true,
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password, fcmToken } = req.body;
  const result = await AuthService.login(email, password, fcmToken);

  //set refresh token in cookie
  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // set maxAge to a number
    sameSite: 'lax',
  });

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'User logged in successfully',
    data: result,
    success: true,
  });
});


// Google Login
const googleLogin = async (req, res) => {
  const { googleId, email, googleAccessToken } = req.body;

  let user = await User.findOne({ googleId });

  if (!user) {
    // New user, register them
    const newUser = await AuthService.createUser({
      email,
      googleId,
      authProvider: TAuthProvider.google,	
      googleAccessToken,
    });
    return sendResponse(res, {
      code: StatusCodes.CREATED,
      message: 'User registered via Google successfully',
      data: newUser,
      success: true,
    });
  }

  // Existing user, update the access token and login
  user.googleAccessToken = googleAccessToken;
  await user.save();

  const tokens = await TokenService.accessAndRefreshToken(user);
  const { password, ...userWithoutPassword } = user.toObject();

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'User logged in via Google successfully',
    data: { userWithoutPassword, tokens },
    success: true,
  });
};

// Apple Login
const appleLogin = async (req, res) => {
  const { appleId, email, appleAccessToken } = req.body;

  let user = await User.findOne({ appleId });

  if (!user) {
    // New user, register them
    const newUser = await AuthService.createUser({
      email,
      appleId,
      authProvider: TAuthProvider.apple,
      appleAccessToken,
    });

    return sendResponse(res, {
      code: StatusCodes.CREATED,
      message: 'User registered via Apple successfully',
      data: newUser,
      success: true,
    });
  }

  // Existing user, update the access token and login
  user.appleAccessToken = appleAccessToken;
  await user.save();

  const tokens = await TokenService.accessAndRefreshToken(user);
  const { password, ...userWithoutPassword } = user.toObject();

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'User logged in via Apple successfully',
    data: { userWithoutPassword, tokens },
    success: true,
  });
};

//[🚧][🧑‍💻✅][🧪]  // 🆗
const verifyEmail = catchAsync(async (req, res) => {
  // console.log(req.body);
  const { email, token, otp } = req.body;
  const result = await AuthService.verifyEmail(email, token, otp);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Email verified successfully',
    data: {
      result,
    },
    success: true,
  });
});

//[🚧][🧑‍💻✅][🧪]  // 🆗
const resendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await AuthService.resendOtp(email);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Otp sent successfully',
    data: result,
    success: true,
  });
});
const forgotPassword = catchAsync(async (req, res) => {
  const result = await AuthService.forgotPassword(req.body.email);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Password reset email sent successfully',
    data: result,
    success: true,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { currentPassword, newPassword } = req.body;
  const result = await AuthService.changePassword(
    userId,
    currentPassword,
    newPassword,
  );
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Password changed successfully',
    data: result,
    success: true,
  });
});
const resetPassword = catchAsync(async (req, res) => {
  const { email, password, otp } = req.body;
  const result = await AuthService.resetPassword(email, password, otp);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Password reset successfully',
    data: {
      result,
    },
    success: true,
  });
});

const logout = catchAsync(async (req, res) => {
  await AuthService.logout(req.body.refreshToken);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'User logged out successfully',
    data: {},
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const tokens = await AuthService.refreshAuth(req.body.refreshToken);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'User logged in successfully',
    data: {
      tokens,
    },
  });
});

export const AuthController = {
  register,
  login,
  verifyEmail,
  resendOtp,
  logout,
  changePassword,
  refreshToken,
  forgotPassword,
  resetPassword,
  googleLogin,
  appleLogin
};
