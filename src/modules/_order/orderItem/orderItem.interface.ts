import { Model, Types } from 'mongoose';


import { PaginateOptions, PaginateResult } from '../../../types/paginate';

export interface IOrderItem {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  orderId :  Types.ObjectId;
  itemId: Types.ObjectId; // 🔥 sure na .. string o hoite pare .. 
  itemType : string ; // 🔥 sure na .. enum houar chance beshi ... .
  itemName : string;
  quantity : number;
  unitPrice : number;
  totalPrice : number;
  isDeleted : Boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrderItemModel extends Model<IOrderItem> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IOrderItem>>;
}