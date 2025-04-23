import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../types/paginate';

export interface IFertie {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; 
  default ?: string;
  isDeleted : Boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TFertie = {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  default ?: string;
  isDeleted : Boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface IFertieModel extends Model<IFertie> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IFertie>>;
}

