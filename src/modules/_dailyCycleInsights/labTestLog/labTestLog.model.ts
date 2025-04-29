import { model, Schema } from 'mongoose';
import paginate from '../../../common/plugins/paginate';
import { ILabTestLog, ILabTestLogModel } from './labTestLog.interface';

const labTestLogSchema = new Schema<ILabTestLog>(
  {
    follicleStimulatingHormoneTest: {
      type: String,
      required: [false, 'follicleStimulatingHormoneTest is required'],
    },
    luteinizingHormoneTest: {
      type: String,
      required: [false, 'luteinizingHormoneTest is required'],
    },
    estradiolTest: {
      type: String,
      required: [false, 'estradiolTest is required'],
    },
    progesteroneTest: {
      type: String,
      required: [false, 'progesteroneTest is required'],
    },

    antiMullerianHormoneTest: {
      type: String,
      required: [false, 'progesteroneTest is required'],
    },

    thyroidStimulatingHormoneTest: {
      type: String,
      required: [false, 'progesteroneTest is required'],
    },

    prolactinTest: {
      type: String,
      required: [false, 'progesteroneTest is required'],
    },

    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

labTestLogSchema.plugin(paginate);

labTestLogSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
labTestLogSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._labTestLogId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const LabTestLog = model<ILabTestLog, ILabTestLogModel>(
  'LabTestLog',
  labTestLogSchema
);
