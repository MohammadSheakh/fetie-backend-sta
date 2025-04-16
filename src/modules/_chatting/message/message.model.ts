import { model, Schema } from 'mongoose';
import paginate from '../../../common/plugins/paginate';
import { IMessage, IMessageModel } from './message.interface';
import { RoleType } from '../conversationParticipents/conversationParticipents.constant';

const messageSchema = new Schema<IMessage>(
  {
    text: {
      type: String,
      required: [true, 'text is required'],
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
        required: [false, 'Attachments is not required'],
      }
    ],
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender Id is required'],
    },
    conversationId : {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation Id is required'],
    },
    senderRole: {
      type: String,
      enum: [
        RoleType.admin,
        RoleType.member,
        
      ],
      required: [
        true,
        `senderRole is required it can be ${Object.values(
          RoleType
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

messageSchema.plugin(paginate);

messageSchema.pre('save', function(next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee
  
  next();
});


// Use transform to rename _id to _projectId
messageSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._messageId = ret._id;  // Rename _id to _subscriptionId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});

export const Message = model<IMessage, IMessageModel>(
  'Message',
  messageSchema
);
