import { model, Schema } from 'mongoose';
import paginate from '../../common/plugins/paginate';
import { IAttachment, IAttachmentModel } from './attachment.interface';
import { AttachedToType, AttachmentType } from './attachment.constant';

const attachmentSchema = new Schema<IAttachment>(
  {
    // 🟢 must needed 
    attachment: {
      type: String,
      required: [true, 'attachment is required'],
    },
    // 🟢 must needed 
    attachmentType : {
      type: String,
      enum : [
         AttachmentType.document,
         AttachmentType.image,
      ],
      required: [
              false,
              `Attached Type is required. It can be ${Object.values(
                AttachmentType
              ).join(', ')}`,
            ],
    },
    // we dont need this in our project 
    attachedToId : {
      type: String,
      required: [false, 'AttachedToId is required.'],
    },

    // 🟢 must needed 
    attachedToType : {
      enum: [
        AttachedToType.user,
        AttachedToType.lab,
      ],
      type: String,
      required: [
        false,
        `AttachedToType is required. It can be ${Object.values(
          AttachedToType
        ).join(', ')}`,
      ],
    },

    // 🟢 must needed 
    uploadedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [false, 'User Id is required'],
    },
  },
  { timestamps: true }
);

attachmentSchema.plugin(paginate);

// Use transform to rename _id to _projectId
attachmentSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._attachmentId = ret._id;  // Rename _id to _projectId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});

export const Attachment = model<IAttachment, IAttachmentModel>(
  'Attachment',
  attachmentSchema
);