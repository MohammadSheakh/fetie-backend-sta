import { model, Schema } from 'mongoose';

import paginate from '../../../common/plugins/paginate';
import { IPaymentMethod, IPaymentMethodModel } from './paymentMethod.interface';


const paymentMethodSchema = new Schema<IPaymentMethod>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['stripe', 'paypal'],
      required: true
    },
    // Card details (for Stripe)
    cardDetails: {
      last4: {
        type: String,
        required: false
      },
      expMonth: {
        type: Number,
        required: false
      },
      expYear: {
        type: Number,
        required: false
      },
      brand: {
        type: String,
        required: false
      }
    },

    isDefault: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

paymentMethodSchema.plugin(paginate);

paymentMethodSchema.pre('save', function(next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  // this.renewalFee = this.initialFee
  
  next();
});


// Use transform to rename _id to _projectId
paymentMethodSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._paymentMethodId = ret._id;  // Rename _id to _subscriptionId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});


export const PaymentMethod = model<IPaymentMethod, IPaymentMethodModel>(
  'PaymentMethod',
  paymentMethodSchema
);
