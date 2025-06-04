import { model, Schema } from 'mongoose';
import paginate from '../../../common/plugins/paginate';
import { UserSubscriptionStatusType } from './userSubscription.constant';
import { IUserSubscription, IUserSubscriptionModel } from './userSubscription.interface';

const webhookEventSchema = new Schema<IUserSubscription>(
  {
    source : {
      type: String,
      required: true,
      enum: ['stripe', 'paypal'],
    },
    eventType : {
      type: String,
      required: true,
    },
    eventId : {
      type: String,
      required: true,
      // unique : true 
    },  
    payload : {
      type: Object,
      required: true,
    },
    processed : {
      type: Boolean,
      required: true,
      default: false,
    },
    processingError : [
      {
        message : String,
        timeStamp : Date,
      },
    ],
    relatedEntities: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
      },
      subscriptionId: {
        type: Schema.Types.ObjectId,
        ref: 'UserSubscription',
        required: false
      },
      transactionId: {
        type: Schema.Types.ObjectId,
        ref: 'PaymentTransaction',
        required: false
      },
      orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: false
      }
    },

    isDeleted : {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

userSubscriptionSchema.plugin(paginate);

// auto calculate the renewal date if its not provided ... 
userSubscriptionSchema.pre('save', function(next) {
  // Rename _id to _projectId
  //this._taskId = this._id;
  //this._id = undefined;  // Remove the default _id field

  if(!this.renewalDate){
    const renewalPeriods = {
      daily: 1,
      weekly : 7,
      monthly: 30, 
      yearly : 365 
    }

    this.renewalDate = new Date(this.subscriptionStartDate);
    this.renewalDate.setDate(this.renewalDate.getDate() + renewalPeriods[this.renewalFrequncy])
  }

  // auto update the status if  renewal date has passed 
  if(this.renewalDate < new Date()){
    this.status = UserSubscriptionStatusType.expired
  }

  next();
});


// Use transform to rename _id to _projectId
userSubscriptionSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._userSubscriptionId = ret._id;  // Rename _id to _userSubscriptionId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});


export const UserSubscription = model<IUserSubscription, IUserSubscriptionModel>(
  'UserSubscription',
  userSubscriptionSchema
);
