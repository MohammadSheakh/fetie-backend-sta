import * as jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import { config } from '../config';
import ApiError from '../errors/ApiError';
import { User } from '../modules/user/user.model';

const getUserDetailsFromToken = async (token: string) => {
  // console.log("token from getUserDetails -> ", token)
  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'you are not authorized!');
  }

  let decode: any;
  // console.log(config.jwt_access_secret)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  try {
    decode = jwt.verify(
      token,
      config.jwt.accessSecret as jwt.Secret
      //config.token.TokenSecret as string,
      // { algorithms: ['HS256'] },
    );
    // console.log("decode -> 🔴🔴", decode)

    /**************
      decode -> 🔴🔴 {
        userId: '685652b61d5e72ec1ecdec51',
        userName: 'undefined undefined',
        email: 'm@gmail.com',
        role: 'user',
        iat: 1750488220,
        exp: 1750920220
      }
     * ************ */
    

  } catch (error) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,'Invalid or expired token...!'+error,
    );
  }

  // console.log({decode})
  const user = await User.findById(decode.userId).select('-subscriptionType -isResetPassword -failedLoginAttempts -stripe_customer_id -authProvider -isGoogleVerified -isAppleVerified -createdAt -updatedAt -__v -password -updatedAt');
  return user;
};

export default getUserDetailsFromToken; // hello 
