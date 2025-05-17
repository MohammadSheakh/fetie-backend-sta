import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../types/paginate';
import { TStatus } from './lab.constant';

export interface ILab {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  attachments? : Types.ObjectId[]; // Array of ObjectId references to Attachment
  name : String;
  email : String;
  url : String;
  description : String;
  status ? : TStatus.active | TStatus.deactivate;
  phone:  String;
  websiteURL: String;
  address: String;
  isDeleted? : Boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILabModel extends Model<ILab> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<ILab>>;
}