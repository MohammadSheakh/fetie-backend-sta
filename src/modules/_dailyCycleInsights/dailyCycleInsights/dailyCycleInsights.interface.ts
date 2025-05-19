import { Model, Types } from 'mongoose';

import {
  TActivity,
  TCervicalMucus,
  TFertilityLevel,
  TMenstrualFlow,
  TMood,
  TPhase,
  TSymptoms,
} from './dailyCycleInsights.constant';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';

export interface IDailyCycleInsights {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId: Types.ObjectId; // 🔗
  dailyFertilityScore : Number;
  labTestLogId: Types.ObjectId;
  menstrualFlow:
    | TMenstrualFlow.light
    | TMenstrualFlow.medium
    | TMenstrualFlow.heavy
    | TMenstrualFlow.spotting
    | TMenstrualFlow.no;
    
  mood:
    | TMood.great
    | TMood.good
    | TMood.relaxed
    | TMood.happy
    | TMood.irritable
    | TMood.indifferent;
  activity: TActivity.intercourse | TActivity.insemination;

  symptoms: TSymptoms[];
  //   TSymptoms.cramps |
  //   TSymptoms.headache |
  //   TSymptoms.backache |
  //   TSymptoms.breastTenderness |
  //   TSymptoms.cervicalMucous |
  //   TSymptoms.others;

  phase:
    | TPhase.menstrual
    | TPhase.follicular
    | TPhase.ovulatory
    | TPhase.luteal
    | TPhase.Unknown;

  fertilityLevel:
    | TFertilityLevel.veryHigh
    | TFertilityLevel.medium
    | TFertilityLevel.low
    | TFertilityLevel.veryLow
    | TFertilityLevel.Unknown;
  cycleDay: Number;

  cervicalMucus: TCervicalMucus.eggWhite | TCervicalMucus.creamy;

  date: Date;

  //////////////// This information come from AI 

  currentCycleInfo ?: string; 
  suggestion ?: string;  
  patternFertieNoticed ? : string;
  whatToKeepInMindInThisCycle ?: string;

  isDeleted: Boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TDailyCycleInsights = {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId: Types.ObjectId; // 🔗
  labTestLogId: Types.ObjectId;
  menstrualFlow:
    | TMenstrualFlow.light
    | TMenstrualFlow.medium
    | TMenstrualFlow.heavy
    | TMenstrualFlow.spotting
    | TMenstrualFlow.no;
  mood:
    | TMood.great
    | TMood.good
    | TMood.relaxed
    | TMood.happy
    | TMood.irritable
    | TMood.indifferent;
  activity: TActivity.intercourse | TActivity.insemination;

  symptoms: TSymptoms[];
  //  TSymptoms.cramps |
  //         TSymptoms.headache |
  //         TSymptoms.backache |
  //         TSymptoms.breastTenderness |
  //         TSymptoms.cervicalMucous |
  //         TSymptoms.others;

  phase:
    | TPhase.menstrual
    | TPhase.follicular
    | TPhase.ovulatory
    | TPhase.luteal;

  fertilityLevel:
    | TFertilityLevel.veryHigh
    | TFertilityLevel.medium
    | TFertilityLevel.low
    | TFertilityLevel.veryLow;
  cycleDay: Number;

  cervicalMucus: TCervicalMucus.eggWhite | TCervicalMucus.creamy;

  date: Date;

  isDeleted: Boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface IDailyCycleInsightsModel extends Model<IDailyCycleInsights> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IDailyCycleInsights>>;
}
