import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';

export interface ILabTestLog {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  follicleStimulatingHormoneTest: String;
  luteinizingHormoneTest: String;
  estradiolTest: String;
  progesteroneTest: String;
  antiMullerianHormoneTest: String;
  thyroidStimulatingHormoneTest: String;
  prolactinTest: String;
  isDeleted: Boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILabTestLogModel extends Model<ILabTestLog> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<ILabTestLog>>;
}
