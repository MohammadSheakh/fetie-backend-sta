import { model, Schema } from 'mongoose';

import paginate from '../../../common/plugins/paginate';


import { ISubscription, ISubscriptionModel } from './subscription.interface';
import { CurrencyType } from '../../_subscription/subscriptionPlan/subscriptionPlan.constant';

const paymentTransactionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    paymentMethodId: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentMethod',
      required: false
    },
    type: {
      type: String,
      enum: ['subscription'], // , 'order'
      required: true
    },
    // For subscription payments
    subscriptionId: {
      type: Schema.Types.ObjectId,
      // ref: 'UserSubscription',
      ref: 'Subscription',
      required: function() { return this.type.toString() === 'subscription'; } // 🔥🔥 bujhi nai 
    },

    // For product purchases
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      // required: function() { return this.type.toString() === 'order'; }
      required: false
    },
    
    paymentMethodOrProcessorOrGateway: {
      type: String,
      enum: ['stripe', 'paypal'],
      required: true
    },
    // External payment IDs
    // stripe_payment_intent_id /  paypal_transaction_id
    externalTransactionOrPaymentId: {
      type: String,
      required: 'true' 
    },
    // stripe_payment_intent_id: {
    //   type: String,
    //   required: function() { return this.paymentProcessor === 'stripe'; }
    // },
    // paypal_transaction_id: {
    //   type: String,
    //   required: function() { return this.paymentProcessor === 'paypal'; }
    // },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be greater than zero']
    },
    currency: {
      type: String,
      enum: [CurrencyType.EUR , CurrencyType.USD],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending'
    },
    
    description: {
      type: String,
      required: false
    },
    billingDetails: {
      name: String,
      email: String,
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        postal_code: String,
        country: String
      }
    },
    metadata: {
      type: Map,
      of: String
    },
    refundDetails: [{
      amount: Number,
      reason: String,
      date: Date,
      refundId: String
    }],
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

paymentTransactionSchema.plugin(paginate);

paymentTransactionSchema.pre('save', function(next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  this.renewalFee = this.initialFee
  
  next();
});


// Use transform to rename _id to _projectId
paymentTransactionSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._subscriptionId = ret._id;  // Rename _id to _subscriptionId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});


export const PaymentTransaction = model<ISubscription, ISubscriptionModel>(
  'PaymentTransactions',
  paymentTransactionSchema
);
