import { model, Schema } from 'mongoose';
import paginate from '../../common/plugins/paginate';
import { IAttachment, IAttachmentModel } from './attachment.interface';
import { AttachedToType, AttachmentType } from './attachment.constant';

const attachmentSchema = new Schema<IAttachment>(
  {
    attachment: {
      type: String,
      required: [true, 'attachment is required'],
    },
    attachmentType : {
      type: String,
      enum : [
         AttachmentType.document,
         AttachmentType.image,
      ],
      required: [true, 'Attached Type is required. It can be pdf / image'],
    },
    attachedToId : {
      type: String,
      required: [false, 'AttachedToId is required.'],
    },
    attachedToType : {
      enum: [
        AttachedToType.lifeStyle,
        AttachedToType.message,
        AttachedToType.suplifyPartner,
        AttachedToType.trainingProgram,
        AttachedToType.user,
        AttachedToType.workout,
        AttachedToType.virtualWorkoutClass,
        AttachedToType.wellnessProduct,
        AttachedToType.meal,
        AttachedToType.suppliment,
      ],
      type: String,
      required: [false, 'AttachedToType is required. It can be note / task'],
    },
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