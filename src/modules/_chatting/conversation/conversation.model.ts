import { model, Schema } from 'mongoose';
import paginate from '../../../common/plugins/paginate';
import { IConversation, IConversationModel } from './conversation.interface';
import { ConversationType } from './conversation.constant';
import { RoleType } from '../message/message.constant';

const conversationSchema = new Schema<IConversation>(
  {
    creatorId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'User',
    required: [true, 'User Id is required'],
    },
    type: {
      type: String,
      enum: [
        ConversationType.direct,
        ConversationType.group,
      ],
      required: [
        true,
        `ConversationType is required it can be ${Object.values(
          ConversationType
        ).join(', ')}`,
      ],
    },
    /*
      attachedToId: {
        // 🔥 fix korte hobe ... eita 
        type: String,
        required: [false, 'attachedToId is not required'],
      },
      attachedToCategory : {
        // 🔥 fix korte hobe ... eita 
        type: String,
        enum: [
          'VirtualWorkoutClass', 
        ],
        required: [false, 'attachedToCategory is not required'],
      },
      // isGroup: {
      //   type: Boolean,
      //   required: [false, 'isGroup is not required'],
      //   default: false,
      // },
    */

      // Add month and year fields to organize conversations by month
    month: {
      type: String,
      required: [true, 'Month is required'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 2023 // Set minimum year as needed
    },
  // You might want to add a title field for better organization
    title: {
      type: String,
      required: [false, 'Title is not required'],
      // default: function() {
      //   const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
      //                     'July', 'August', 'September', 'October', 'November', 'December'];
      //   return `${monthNames[this.month - 1]} ${this.year}`;
      // }

      // default: function(this: any): string {
      //     const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
      //                       'July', 'August', 'September', 'October', 'November', 'December'];
      //     return `${monthNames[this.month - 1]} ${this.year}`;
      // }
    },

    lastMessageSenderRole: {
          type: String,
          enum: [
            RoleType.bot,
            RoleType.user,
          ],
          required: [
            false,
            `lastMessageSenderRole is required it can be ${Object.values(
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

conversationSchema.plugin(paginate);

conversationSchema.pre('save', function(next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee
  
  next();
});


// Use transform to rename _id to _projectId
conversationSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._conversationId = ret._id;  // Rename _id to _subscriptionId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});


export const Conversation = model<IConversation, IConversationModel>(
  'Conversation',
  conversationSchema
);
