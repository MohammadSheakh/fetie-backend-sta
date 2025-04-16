import { Model, Types } from 'mongoose';


import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { CurrencyType, InitialDurationType, RenewalFrequncyType, SubscriptionType } from './subscription.constant';

export interface ISubscription {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  subscriptionName : string;
  subscriptionType: SubscriptionType.premium | SubscriptionType.standard | SubscriptionType.vip; // Array of ObjectId references to Attachment
  initialDuration : InitialDurationType.day | InitialDurationType.month | InitialDurationType.week | InitialDurationType.year;
  renewalFrequncy : RenewalFrequncyType.daily | RenewalFrequncyType.monthly | RenewalFrequncyType.weekly | RenewalFrequncyType.yearly;
  initialFee : 0;
  renewalFee : 0;
  currency : CurrencyType.USD | CurrencyType.EUR;
  features: String[];
  freeTrialDuration : Number;
  freeTrialEnabled : Boolean;
  isDeleted : Boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISubscriptionModel extends Model<ISubscription> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<ISubscription>>;
}