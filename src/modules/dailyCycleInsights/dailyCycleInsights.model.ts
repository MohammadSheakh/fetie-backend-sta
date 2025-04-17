import { model, Schema } from 'mongoose';
import {
  TActivity,
  TFertilityLevel,
  TMenstrualFlow,
  TMood,
  TPhase,
  TSymptoms,
} from './dailyCycleInsights.constant';

import paginate from '../../common/plugins/paginate';
import { IDailyCycleInsights, IDailyCycleInsightsModel } from './dailyCycleInsights.interface';

const dailyCycleInsightsSchema = new Schema<IDailyCycleInsights>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User Id is required'],
    },
    menstrualFlow: {
      type: String,
      enum: [
        TMenstrualFlow.light,
        TMenstrualFlow.medium,
        TMenstrualFlow.heavy,
        TMenstrualFlow.spotting,
      ],
      required: [true, `Menstrual flow is required it can be ${Object.values(
        TMenstrualFlow
      ).join(', ')}`],
    },
    mood: {
      type: String,
      enum: [
        TMood.great,
        TMood.good,
        TMood.relaxed,
        TMood.happy,
        TMood.irritable,
        TMood.indifferent
      ],
      required: [true, `Menstrual flow is required it can be ${Object.values(
        TMood
      ).join(', ')}`],
    },
    activity : {
      type : String,
      enum : [
        TActivity.intercourse,
        TActivity.insemination,
      ],
      required: [true, `Menstrual flow is required it can be ${Object.values(
        TActivity
      ).join(', ')}`],
    },
    symptoms : {
      type : String,
      enum : [
        TSymptoms.cramps,
        TSymptoms.headache,
        TSymptoms.backache,
        TSymptoms.breastTenderness,
        TSymptoms.cervicalMucous,
        TSymptoms.others,
      ],
      required: [true, `Menstrual flow is required it can be ${Object.values(
        TSymptoms
      ).join(', ')}`],
    },
    phase : {
      type : String,
      enum : [
        TPhase.menstrual,
        TPhase.follicular,
        TPhase.ovulatory,
        TPhase.luteal,
      ],
      required: [true, `Menstrual flow is required it can be ${Object.values(
        TPhase
      ).join(', ')}`],
    },
    fertilityLevel: {
      type: String,
      enum: [
        TFertilityLevel.veryHigh,
        TFertilityLevel.medium,
        TFertilityLevel.low,
        TFertilityLevel.veryLow,
      ],
      required: [true, `Menstrual flow is required it can be ${Object.values(
        TFertilityLevel
      ).join(', ')}`],
    },
    cycleDay : {
      type : Number,
      required : [true, 'cycleDay is required'],
    },
    date : {
      type : Date,
      required : [true, 'date is required'],
    },
  },
  { timestamps: true }
);

dailyCycleInsightsSchema.plugin(paginate);

dailyCycleInsightsSchema.pre('save', function(next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  // this.renewalFee = this.initialFee
  
  next();
});


// Use transform to rename _id to _projectId
dailyCycleInsightsSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._subscriptionId = ret._id;  // Rename _id to _subscriptionId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});


export const DailyCycleInsights = model<IDailyCycleInsights, IDailyCycleInsightsModel>(
  'DailyCycleInsights',
  dailyCycleInsightsSchema
);
