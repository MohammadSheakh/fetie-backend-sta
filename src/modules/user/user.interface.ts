import { Document, Model, Types } from 'mongoose';
import { Role } from '../../middlewares/roles';
import { IMaritalStatus, TAuthProvider, TGender, TUserStatus } from './user.constant';
import { PaginateOptions, PaginateResult } from '../../types/paginate';

export enum TSubscriptionType{
  free = 'free',
  premium = 'premium',
}

export type TProfileImage = {
  imageUrl: string;
  // file: Record<string, any>;
};

export type TPhotoGallery = {
  imageUrl: string;
  file: Record<string, any>;
};

export type TUser = {
  _userId: undefined | Types.ObjectId;
  _id:  undefined; // Types.ObjectId |
  // fullName: string;
  fname: string;
  lname: string;
  email: string;
  password: string;
  profileImage?: TProfileImage;
  fcmToken : string;
  
  address: {
    streetAddress: string;
    city: string;
    zipCode: string;
    country: string;
  };

  role: Role;

  isEmailVerified: boolean;
  isVip  : Boolean,
  isStandard  : Boolean,
  isPremium :  Boolean

  phoneNumber : string;
  isDeleted: boolean;
  lastPasswordChange: Date;
  isResetPassword: boolean;
  failedLoginAttempts: number;
  lockUntil: Date | undefined;
  // -- google  and apple login 
  googleId: string;
  appleId: string;
  authProvider: TAuthProvider.apple | TAuthProvider.google | TAuthProvider.local;
  googleAccessToken : string;
  appleAccessToken : string;
  isGoogleVerified : boolean;
  isAppleVerified : boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface UserModal extends Model<TUser> {
  paginate: (
    filter: object,
    options: PaginateOptions,
  ) => Promise<PaginateResult<TUser>>;
  isExistUserById(id: string): Promise<Partial<TUser> | null>;
  isExistUserByEmail(email: string): Promise<Partial<TUser> | null>;
  isMatchPassword(password: string, hashPassword: string): Promise<boolean>;
}
