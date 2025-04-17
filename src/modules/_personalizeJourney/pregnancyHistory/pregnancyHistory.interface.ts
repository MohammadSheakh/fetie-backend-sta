import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';

export interface IPregnancyHistory {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  haveYouEverBeenPregnant : Boolean;
  howManyTimes : Number;
  outcomes : String;
  wasItWithYourCurrentPartner : Boolean;
  isDeleted : Boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPregnancyHistoryModel extends Model<IPregnancyHistory> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IPregnancyHistory>>;
}