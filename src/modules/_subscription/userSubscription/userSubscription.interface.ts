import { Model, Types } from 'mongoose';


import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { UserSubscriptionStatusType } from './userSubscription.constant';
import { RenewalFrequncyType } from '../subscriptionPlan/subscriptionPlan.constant';

export interface IUserSubscription {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId :  Types.ObjectId; //🔗
  subscriptionPlanId: Types.ObjectId; //🔗


  subscriptionStartDate : Date;
  currentPeriodStartDate : Date;
  renewalDate : Date;
  billingCycle: Number;
  isAutoRenewed : Boolean;
  cancelledAt :  Date ;
  cancelledAtPeriodEnd : Boolean;
  status :
  UserSubscriptionStatusType.active | 
          UserSubscriptionStatusType.past_due | 
          UserSubscriptionStatusType.cancelled | 
          UserSubscriptionStatusType.unpaid | 
          UserSubscriptionStatusType.incomplete | 
          UserSubscriptionStatusType.incomplete_expired | 
          UserSubscriptionStatusType.trialing;
  
  stripe_subscription_id : String;
  stripe_customer_id : String;
  

  // isFreeTrial : Boolean;
  // freeTrialStartDate : Date;
  // freeTrialEndDate : Date;
  // trialConvertedToPaid : Boolean;

  trxId : String; // 📢 sure na 
  isActive : Boolean
  
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