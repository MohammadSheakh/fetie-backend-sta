import { Model, Types } from 'mongoose';


import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { CurrencyType, InitialDurationType, RenewalFrequncyType, SubscriptionType } from './subscriptionPlan.constant';

export interface ISubscriptionPlan {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  subscriptionName : string;
  subscriptionType: SubscriptionType.premium;  //   | SubscriptionType.standard | SubscriptionType.vip
  initialDuration :  InitialDurationType.month ;
  renewalFrequncy : RenewalFrequncyType.monthly ;
  amount : string //number;
  // renewalFee : 0;
  currency : CurrencyType.USD; //  | CurrencyType.EUR
  features: String[];
  // freeTrialDuration : Number;
  // freeTrialEnabled : Boolean;
  fullAccessToInteractiveChat : Boolean;
  canViewCycleInsights: Boolean;
  
  stripe_product_id : String;
  stripe_price_id : String;

  isActive : Boolean;
  isDeleted : Boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TSubscriptionPlan = {
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  subscriptionName : string;
  subscriptionType: SubscriptionType.premium;  //   | SubscriptionType.standard | SubscriptionType.vip
  initialDuration :  InitialDurationType.month  ;
  renewalFrequncy :  RenewalFrequncyType.monthly ;
  amount : 0;
  // renewalFee : 0;
  currency : CurrencyType.USD; //  | CurrencyType.EUR
  features: String[];
  // freeTrialDuration : Number;
  // freeTrialEnabled : Boolean;

  stripe_product_id : String;
  stripe_price_id : String;

  isActive : Boolean;

  isDeleted : Boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISubscriptionPlanModel extends Model<ISubscriptionPlan> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<ISubscriptionPlan>>;
}