import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { OrderStatus, OrderType } from './order.constant';

export interface IOrder {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId : Types.ObjectId;
  totalAmount: Number;
  orderType : OrderType.premium;
  orderStatus : OrderStatus.pending | 
                OrderStatus.processing | 
                OrderStatus.complete | 
                OrderStatus.failed | 
                OrderStatus.refunded;
  orderNotes : string;
  isDeleted : Boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrderModel extends Model<IOrder> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IOrder>>;
}