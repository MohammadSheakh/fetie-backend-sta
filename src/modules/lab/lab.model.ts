import { model, Schema } from 'mongoose';

import paginate from '../../common/plugins/paginate';
import { ILab, ILabModel } from './lab.interface';
import { TStatus } from './lab.constant';


const labSchema = new Schema<ILab>(
  {
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
        required: [true, 'Attachments is required'],
      }
    ],
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
    },
    url: {
      type: String,
      required: [true, 'Url is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
    },
    websiteURL: {
      type: String,
      required: [true, 'WebsiteURL is required'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    status : {
      type: String,
      enum: [TStatus.active, TStatus.deactivate],
      default: TStatus.active,
      required: [
              false,
              `status is required. It can be ${Object.values(
                TStatus
              ).join(', ')}`,
            ],
    },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

labSchema.plugin(paginate);

labSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
labSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._labId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

export const Lab = model<
  ILab,
  ILabModel
>('Lab', labSchema);
