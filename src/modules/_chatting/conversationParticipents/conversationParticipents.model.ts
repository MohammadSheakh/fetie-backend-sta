import { model, Schema } from 'mongoose';
import paginate from '../../../common/plugins/paginate';
import { IConversationParticipents, IConversationParticipentsModel } from './conversationParticipents.interface';
import { RoleType } from './conversationParticipents.constant';

const conversationParticipentsSchema = new Schema<IConversationParticipents>(
  {
    userId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User Id is required'],
    },
    conversationId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation Id is required'],
    },
    joinedAt :{
      type: Date,
      required: [true, 'joinedAt is required'],
      default: Date.now,
    },
    role: {
          type: String,
          enum: [
            RoleType.admin,
            RoleType.member,
          ],
          required: [
            true,
            `RoleType is required it can be ${Object.values(
              RoleType
            ).join(', ')}`,
          ],
        },

    // role : {
    //   enum : [
    //     RoleType.admin,
    //     RoleType.member
    //   ],
    //   required: [true, `role is required it can be ${Object.values(
    //     RoleType
    //   ).join(', ')}`],
    // },
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

conversationParticipentsSchema.plugin(paginate);

conversationParticipentsSchema.pre('save', function(next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee
  next();
});

// Use transform to rename _id to _projectId
conversationParticipentsSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._conversationParticipentsId = ret._id;  // Rename _id to _subscriptionId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});


export const ConversationParticipents = model<IConversationParticipents, IConversationParticipentsModel>(
  'ConversationParticipents',
  conversationParticipentsSchema
);
