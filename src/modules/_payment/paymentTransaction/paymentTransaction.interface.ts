import { Model, Types } from 'mongoose';


import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { CurrencyType, InitialDurationType, RenewalFrequncyType, SubscriptionType } from './subscriptionPlan.constant';

export interface IPaymentTransaction {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId : Types.ObjectId;
  paymentMethodId  ? : Types.ObjectId;
  type ?: 'subscription';
  subscriptionId ?: Types.ObjectId;
  orderId ?: Types.ObjectId;
  paymentMethodOrProcessorOrGateway : 'stripe' | 'paypal';
  externalTransactionOrPaymentId : string; // to store payment intent id .. 
  amount  ?: number;
  currency ?: CurrencyType.USD;
  paymentStatus ?: 'succeeded' | 'pending' | 'failed';
  description ?: string;

  isActive ?: Boolean;
  isDeleted ?: Boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TPaymentTransaction = {
   _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId : Types.ObjectId;
  paymentMethodId  ?: Types.ObjectId;
  type : 'subscription';
  subscriptionId : Types.ObjectId;
  orderId ?: Types.ObjectId;
  paymentMethodOrProcessorOrGateway : 'stripe' | 'paypal';
  externalTransactionOrPaymentId : string;
  amount : number;
  currency: CurrencyType.USD;
  paymentStatus : 'succeeded' | 'pending' | 'failed';
  description : string;

  isActive : Boolean;
  isDeleted : Boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPaymentTransactionModel extends Model<IPaymentTransaction> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IPaymentTransaction>>;
}