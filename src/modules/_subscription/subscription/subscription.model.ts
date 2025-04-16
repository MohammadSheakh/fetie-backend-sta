import { model, Schema } from 'mongoose';

import paginate from '../../../common/plugins/paginate';
import {
  CurrencyType,
  InitialDurationType,
  RenewalFrequncyType,
  SubscriptionType,
} from './subscription.constant';

import { ISubscription, ISubscriptionModel } from './subscription.interface';

const subscriptionSchema = new Schema<ISubscription>(
  {
    subscriptionName: {
      type: String,
      required: [true, 'Subscription name is required'],
      trim: true,
      unique: false,
      minlength: 2,
      maxlength: 100,
    },
    subscriptionType: {
      type: String,
      enum: [
        SubscriptionType.standard,
        SubscriptionType.premium,
        SubscriptionType.vip,
      ],
      required: [
        true,
        `subscriptionType is required it can be ${Object.values(
          SubscriptionType
        ).join(', ')}`,
      ],
    },
    initialDuration: {
      type: String,
      enum: [
        // InitialDurationType.day,
        // InitialDurationType.week,
        InitialDurationType.month,
        InitialDurationType.year,
      ],
      default: InitialDurationType.month,
      required: [
        true,
        `Initial Duration is required.. it can be  ${Object.values(InitialDurationType).join(
          ', '
        )}`,
      ],
    },
    renewalFrequncy: {
      type: String,
      enum: [
        // RenewalFrequncyType.daily,
        // RenewalFrequncyType.weekly,
        RenewalFrequncyType.monthly,
        RenewalFrequncyType.yearly,
      ],
      default: RenewalFrequncyType.monthly,
      required: [
        true,
        `Renewal Frequncy is required .. It can be  ${Object.values(
          RenewalFrequncyType
        ).join(', ')}`,
      ],
    },
    initialFee: {
      type: Number,
      required: [false, 'Initial Fee is required'],
      min: [0, 'Initial Fee must be greater than zero'],
    },
    renewalFee: {
      type: Number,
      required: [false, 'Renewal Fee is required'],
      min: [0, 'Renewal Fee must be greater than zero'],
    },
    currency: {
      type: String,
      enum: [CurrencyType.USD, CurrencyType.EUR],
      required: [
        true,
        `Currency is required .. it can be  ${Object.values(CurrencyType).join(
          ', '
        )}`,
      ],
      default: CurrencyType.USD,
    },
    features: {
      //> One Subscription can have multiple features ...
      type: [String],
      required: [true, 'Features is required'],
    },
    freeTrialDuration: {
      type: Number, // Duration in days
      default: 0, // Default to no free trial
      min: [0, 'Free trial duration must be non-negative'],
    },
    freeTrialEnabled: {
      type: Boolean,
      default: false, // Indicates if the subscription supports a free trial
    },
  
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

subscriptionSchema.plugin(paginate);

subscriptionSchema.pre('save', function(next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  this.renewalFee = this.initialFee
  
  next();
});


// Use transform to rename _id to _projectId
subscriptionSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._subscriptionId = ret._id;  // Rename _id to _subscriptionId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});


export const Subscription = model<ISubscription, ISubscriptionModel>(
  'Subscription',
  subscriptionSchema
);
