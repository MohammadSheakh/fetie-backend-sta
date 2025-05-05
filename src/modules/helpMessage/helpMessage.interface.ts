import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../types/paginate';

export interface IHelpMessage {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId: Types.ObjectId;
  message : String;
  seenStatus : Boolean;

  isDeleted : Boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IHelpMessageModel extends Model<IHelpMessage> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IHelpMessage>>;
}