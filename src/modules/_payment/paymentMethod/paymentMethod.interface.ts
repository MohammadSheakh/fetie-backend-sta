import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';

export interface IPaymentMethod {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId : Types.ObjectId;
  type ?: 'subscription' | "paypal";
  cardDetails : {
    last4 ?: string;
    expMonth ?: number;
    expYear ?: number;
    brand ?: string;
  },
  isDefault ?: boolean;
  isActive ?: boolean;
  isDeleted ?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}



export interface IPaymentMethodModel extends Model<IPaymentMethod> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IPaymentMethod>>;
}