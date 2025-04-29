import { model, Schema } from 'mongoose';
import {
  TActivity,
  TCervicalMucus,
  TFertilityLevel,
  TMenstrualFlow,
  TMood,
  TPhase,
  TSymptoms,
} from './dailyCycleInsights.constant';

import paginate from '../../../common/plugins/paginate';
import {
  IDailyCycleInsights,
  IDailyCycleInsightsModel,
} from './dailyCycleInsights.interface';

const dailyCycleInsightsSchema = new Schema<IDailyCycleInsights>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User Id is required'],
    },

    labTestLogId: {
      type: Schema.Types.ObjectId,
      ref: 'LabTestLog',
      required: [true, 'User Id is required'],
    },
    menstrualFlow: {
      type: String,
      enum: [
        TMenstrualFlow.light,
        TMenstrualFlow.medium,
        TMenstrualFlow.heavy,
        TMenstrualFlow.spotting,
        TMenstrualFlow.no,
      ],
      required: [
        false,
        `Menstrual flow is not required it can be ${Object.values(
          TMenstrualFlow
        ).join(', ')}`,
      ],
    },
    mood: {
      type: String,
      enum: [
        TMood.great,
        TMood.good,
        TMood.relaxed,
        TMood.happy,
        TMood.irritable,
        TMood.indifferent,
      ],
      required: [
        false,
        `mood is not required it can be ${Object.values(TMood).join(', ')}`,
      ],
    },
    activity: {
      type: String,
      enum: [TActivity.intercourse, TActivity.insemination],
      required: [
        false,
        `activity is not required it can be ${Object.values(TActivity).join(
          ', '
        )}`,
      ],
    },
    symptoms: {
      type: [String],
      enum: [
        TSymptoms.cramps,
        TSymptoms.headache,
        TSymptoms.backache,
        TSymptoms.breastTenderness,
        TSymptoms.cervicalMucous,
        TSymptoms.pain,
        TSymptoms.bloating,
        TSymptoms.others,
      ],
      required: [
        false,
        `symptoms is not required it can be ${Object.values(TSymptoms).join(
          ', '
        )}`,
      ],
    },
    phase: {
      // auto calculate .. or chinta korte hobe ..
      type: String,
      enum: [
        TPhase.menstrual,
        TPhase.follicular,
        TPhase.ovulatory,
        TPhase.luteal,
      ],
      required: [
        false,
        `phase is not required it can be ${Object.values(TPhase).join(', ')}`,
      ],
    },
    fertilityLevel: {
      type: String,
      enum: [
        TFertilityLevel.veryHigh,
        TFertilityLevel.medium,
        TFertilityLevel.low,
        TFertilityLevel.veryLow,
      ],
      required: [
        false,
        `fertilityLevel is not required it can be ${Object.values(
          TFertilityLevel
        ).join(', ')}`,
      ],
    },
    cycleDay: {
      type: Number,
      required: [false, 'cycleDay is not required'],
    },
    cervicalMucus: {
      type: String,
      enum: [TCervicalMucus.eggWhite, TCervicalMucus.creamy],
      required: [
        false,
        `cervicalMucus is not required it can be ${Object.values(
          TCervicalMucus
        ).join(', ')}`,
      ],
    },
    date: {
      type: Date,
      required: [true, 'date is required'],
    },
  },
  { timestamps: true }
);

dailyCycleInsightsSchema.plugin(paginate);

dailyCycleInsightsSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  // this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
dailyCycleInsightsSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._dailyCycleInsightsId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const DailyCycleInsights = model<
  IDailyCycleInsights,
  IDailyCycleInsightsModel
>('DailyCycleInsights', dailyCycleInsightsSchema);
