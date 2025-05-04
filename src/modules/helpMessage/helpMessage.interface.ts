import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../types/paginate';

export interface IHelpMessage {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  dateOfBirth : Date;
  

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