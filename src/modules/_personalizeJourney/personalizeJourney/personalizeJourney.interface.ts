import { Model, Types } from 'mongoose';


import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { OrderStatus, OrderType } from './order.constant';

export interface IPersonalizeJourney {
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

export interface IPersonalizeJourneyModel extends Model<IPersonalizeJourney> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IPersonalizeJourney>>;
}