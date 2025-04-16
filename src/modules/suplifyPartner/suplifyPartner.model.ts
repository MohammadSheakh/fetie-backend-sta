import { model, Schema } from 'mongoose';
import paginate from '../../common/plugins/paginate';
import { ISuplifyPartner, ISuplifyPartnerModel } from './suplifyPartner.interface';
import { SuplifyPartnerCategory } from './suplifyPartner.constant';

const suplifyPartnerSchema = new Schema<ISuplifyPartner>(
  {
    category: {
      type: String,
      enum: [
        SuplifyPartnerCategory.gym,
        SuplifyPartnerCategory.healthStore,
        SuplifyPartnerCategory.wellnessCenter,
        ],
      required: [true, 'category is required'],
    },
    partnerName : {
      type: String,
      required: [true, 'PartnerName is required'],
    },

    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
        required: [false, 'Attachments is not required'],
      }
    ],

    description : {
      type: String,
      required: [true, 'Description is required'],
    },

    location: {
      locationName : {
        type: String,
        required: [true, 'LocationName is required'],
      },
      latitude: {
        type: String,
        required: true,
      },
      longitude: {
        type: String,
        required: true,
      },
    },
    isDeleted : {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

suplifyPartnerSchema.plugin(paginate);

// taskSchema.pre('save', function(next) {
//   // Rename _id to _projectId
//   this._taskId = this._id;
//   this._id = undefined;  // Remove the default _id field
//   next();
// });


// Use transform to rename _id to _projectId
suplifyPartnerSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._suplifyPartnerId = ret._id;  // Rename _id to _projectId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});


export const SuplifyPartner = model<ISuplifyPartner, ISuplifyPartnerModel>(
  'SuplifyPartner',
  suplifyPartnerSchema
);
