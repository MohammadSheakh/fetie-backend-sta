import { model, Schema } from 'mongoose';
import paginate from '../../../common/plugins/paginate';
import { IPregnancyHistory, IPregnancyHistoryModel } from './pregnancyHistory.interface';

const pregnancyHistorySchema = new Schema<IPregnancyHistory>(
  {
    haveYouEverBeenPregnant : {
      type : Boolean,
      required : [true, 'haveYouEverBeenPregnant is required'],
      default : false
    },
    howManyTimes : {
      type : Number,
      required : [true, 'howManyTimes is required'],
      default : 0
    },
    outcomes: {
      type : String,
      required : [true, 'outcomes is required'],
    },
    wasItWithYourCurrentPartner : {
      type : Boolean,
      required : [true, 'wasItWithYourCurrentPartner is required'],
      default : false
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

pregnancyHistorySchema.plugin(paginate);

pregnancyHistorySchema.pre('save', function(next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee
  
  next();
});


// Use transform to rename _id to _projectId
pregnancyHistorySchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._orderId = ret._id;  // Rename _id to _subscriptionId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});

export const Order = model<IPregnancyHistory, IPregnancyHistoryModel>(
  'PregnancyHistory',
  pregnancyHistorySchema
);
