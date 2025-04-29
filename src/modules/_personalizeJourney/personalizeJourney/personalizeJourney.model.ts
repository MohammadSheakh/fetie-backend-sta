import { model, Schema } from 'mongoose';
import paginate from '../../../common/plugins/paginate';
import {
  TDescribeFlow,
  THeightUnit,
  TPainType,
  TTrackOvulationBy,
  TWeightUnit,
} from './personalizeJourney.constant';
import {
  IPersonalizeJourney,
  IPersonalizeJourneyModel,
} from './personalizeJourney.interface';

const personalizeJourneySchema = new Schema<IPersonalizeJourney>(
  {
    dateOfBirth: {
      type: Date,
      required: [true, 'dateOfBirth is required'],
    },

    // 🔥 dateOfBirth er upor base kore age calculate korte hobe ..
    age: {
      type: Number,
      required: [true, 'age is required'],
    },
    height: {
      type: Number,
      required: [true, 'height is required'],
    },
    heightUnit: {
      type: String,
      enum: [THeightUnit.cm, THeightUnit.inch],
      required: [
        true,
        `heightUnit is required it can be ${Object.values(THeightUnit).join(
          ', '
        )} `,
      ],
    },
    weight: {
      type: Number,
      required: [true, 'weight is required'],
    },
    weightUnit: {
      type: String,
      enum: [TWeightUnit.kg, TWeightUnit.lbs],
      required: [
        true,
        `weightUnit is required it can be ${Object.values(THeightUnit).join(
          ', '
        )} `,
      ],
    },

    // --------------------------
    tryingToConceive: {
      type: Boolean,
      required: [true, 'tryingToConceive is required'],
      default: false,
    },
    areCyclesRegular: {
      type: Boolean,
      required: [true, 'areCycleRegular is required'],
      default: false,
    },
    describeFlow: {
      type: String,
      enum: [TDescribeFlow.light, TDescribeFlow.normal, TDescribeFlow.heavy],
      required: [
        true,
        `describeFlow is required it can be ${Object.values(TDescribeFlow).join(
          ', '
        )}`,
      ],
    },

    // ---------------------------
    periodStartDate: {
      type: Date,
      required: [true, 'periodStartDate is required'],
    },
    periodLength: {
      type: Number,
      required: [true, 'periodLength is required'],
    },
    periodEndDate: {
      // 🔥 this needs to be calculated
      type: Date,
      required: [false, 'periodEndDate is not required'],
    },

    // --------------------------

    avgMenstrualCycleLength: {
      type: Number,
      required: [true, 'avgMenstrualCycleLength is required'],
    },

    // --------------------------  optional

    trackOvulationBy: {
      type: [String],
      enum: [
        TTrackOvulationBy.ovulationTests,
        TTrackOvulationBy.basalBodyTemp,
        TTrackOvulationBy.cervicalMucus,
        TTrackOvulationBy.progesteroneTesting,
        TTrackOvulationBy.none,
      ],
      required: false,
    },
    doYouHavePain: {
      type: String,
      enum: [
        TPainType.mild,
        TPainType.moderate,
        TPainType.severe,
        TPainType.no,
      ],
      required: [
        false,
        `doYouHavePain is required it can be ${Object.values(TPainType).join(
          ', '
        )}`,
      ],
    },
    // --------------------------

    expectedPeriodStartDate: {
      // expectedPeriodDate
      type: Date,
      required: [false, 'expectedPeriodDate is not required'],
    },
    predictedOvulationDate: {
      // 🔥 this needs to be calculated
      type: Date,
      required: [false, 'predictedOvulationDate is not required'],
    },

    // 🔥🔥 ei duitar jonno  Day gula o save kore rakhte hobe kina ..

    pregnancy_History_Id: {
      type: Schema.Types.ObjectId,
      ref: 'PregnancyHistory', // Reference to the pregnancyHistory schema
    },
    medical_And_LifeStyle_Id: {
      type: Schema.Types.ObjectId,
      ref: 'MedicalAndLifeStyle', // Reference to the medicalAndLifeStyle schema
    },

    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

personalizeJourneySchema.plugin(paginate);

personalizeJourneySchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
personalizeJourneySchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._personalizeJourneyId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const PersonalizeJourney = model<
  IPersonalizeJourney,
  IPersonalizeJourneyModel
>('PersonalizeJourney', personalizeJourneySchema);
