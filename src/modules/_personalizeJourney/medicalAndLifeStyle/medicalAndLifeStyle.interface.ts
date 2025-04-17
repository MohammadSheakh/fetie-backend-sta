import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';

export interface IMedicalAndLifeStyle {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  medicalConditionsOrSergeriesDetails : String;

  medicationAndSuplimentsDetails : String;

  anyHistoryOfStdOrPelvicInfection : Boolean;

  doYouSmokeDrink : Boolean;

  anyFamilyHealthConditionLegacy : String;

  wantToSharePartnersHeathInfo : String;

  isDeleted : Boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMedicalAndLifeStyleModel extends Model<IMedicalAndLifeStyle> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IMedicalAndLifeStyle>>;
}