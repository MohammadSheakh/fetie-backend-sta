import { model, Schema } from 'mongoose';
import { IHelpMessage, IHelpMessageModel } from './helpMessage.interface';
import paginate from '../../common/plugins/paginate';


const helpMessageSchema = new Schema<IHelpMessage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    message: {
      type: String,
      required: [true, 'dateOfBirth is required'],
    },
    seenStatus: {
      type: Boolean,
      required: [false, 'seenStatus is not required'],
      default: false,
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

helpMessageSchema.plugin(paginate);

helpMessageSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
helpMessageSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._helpMesssageId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const HelpMessage = model<
  IHelpMessage,
  IHelpMessageModel
>('HelpMessage', helpMessageSchema);
