import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { CurrencyType } from '../../_subscription/subscriptionPlan/subscriptionPlan.constant';
import { TPaymentStatus } from './paymentTransaction.constant';

export interface IPaymentTransaction {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId : Types.ObjectId;
  paymentMethodId  ? : Types.ObjectId; // for this project we dont need any paymentMethodId
  type ?: 'subscription'; // , 'order' // for this project we dont have anything to order .. 
  subscriptionPlanId ?: Types.ObjectId;
  userSubscriptionId ?: Types.ObjectId;
  orderId ?: Types.ObjectId;
  paymentMethodOrProcessorOrGateway : 'stripe' | 'paypal';
  stripe_payment_intent_id ?: string; // to store payment intent id ..
  externalTransactionOrPaymentId : string; // to store payment intent id .. 
  amount  ?: number;
  currency ?: CurrencyType.USD;
  paymentStatus ?: TPaymentStatus.disputed | TPaymentStatus.succeeded | TPaymentStatus.pending | TPaymentStatus.failed | TPaymentStatus.uncaptured;
  description ?: string;
  billingDetails  : any;
  metadata : any;
  refundDetails:any;
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
  subscriptionPlanId : Types.ObjectId;
  userSubscriptionId : Types.ObjectId;
  orderId ?: Types.ObjectId;
  paymentMethodOrProcessorOrGateway : 'stripe' | 'paypal';
  stripe_payment_intent_id : string; // to store payment intent id ..
  externalTransactionOrPaymentId : string;
  amount : number;
  currency: CurrencyType.USD;
  paymentStatus : TPaymentStatus.disputed | TPaymentStatus.succeeded | TPaymentStatus.pending | TPaymentStatus.failed | TPaymentStatus.uncaptured;
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