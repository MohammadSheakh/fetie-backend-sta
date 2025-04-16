import { Model, Types } from 'mongoose';


import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { UserSubscriptionStatusType } from './userSubscription.constant';
import { RenewalFrequncyType } from '../subscription/subscription.constant';

export interface IUserSubscription {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId :  Types.ObjectId; //🔗
  subscriptionId: Types.ObjectId; //🔗
  subscriptionStartDate : Date;
  renewalDate : Date;
  currentPeriodStartDate : Date;
  renewalFrequncy : RenewalFrequncyType.daily | RenewalFrequncyType.monthly | RenewalFrequncyType.weekly | RenewalFrequncyType.yearly;
  trxId : String; // 📢 sure na 
  isActive : Boolean
  isAutoRenewed : Boolean;
  status : UserSubscriptionStatusType.active | UserSubscriptionStatusType.cancelled | UserSubscriptionStatusType.expired;
  billingCycle: Number;

  currentBillingAmount : Number; // 🚧 Dorkar ase kina sure na .. 

  cancelledAt :  Date ;

  isFreeTrial : Boolean;
  freeTrialStartDate : Date;
  freeTrialEndDate : Date;
  trialConvertedToPaid : Boolean;
  
  stripe_subscription_id : String;

  external_customer_id : String;

  isDeleted : boolean;
  createdAt?: Date;
  updatedAt?: Date;
 }

export interface IUserSubscriptionModel extends Model<IUserSubscription> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
    ) => Promise<PaginateResult<IUserSubscription>>;
}