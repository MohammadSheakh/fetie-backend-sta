import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TDescribeFlow, THeightUnit, TPainType, TTrackOvulationBy, TWeightUnit } from './personalizeJourney.constant';

export interface IPersonalizeJourney {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  dateOfBirth : Date;
  age : Number;
  height : Number;
  heightUnit : THeightUnit.cm | THeightUnit.inch;
  weight : Number;
  weightUnit : TWeightUnit.kg | TWeightUnit.lbs;
  // -------
  tryingToConceive : Boolean;
  areCyclesRegular : Boolean;
  describeFlow : TDescribeFlow.heavy | TDescribeFlow.light | TDescribeFlow.normal;

  // ---------- 

  periodStartDate : Date;
  periodLength : Number;
  periodEndDate : Date;

  // -----------

  avgMenstrualCycleLength : Number ; 

  // ----------- optional 

  trackOvulationBy : TTrackOvulationBy[];

  doYouHavePain : TPainType.mild |
                  TPainType.moderate |
                  TPainType.severe |
                  TPainType.no;
  // -------------

  expectedPeriodStartDate : Date; // expectedPeriodDate
  predictedOvulationDate : Date; // 📢 chinta korte hobe .. etao ki predictedOvulationStartDate hobe kina .. 

  pregnancy_History_Id : Types.ObjectId; // 🔗
  medical_And_LifeStyle_Id : Types.ObjectId; // 🔗

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