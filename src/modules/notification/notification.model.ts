import { model, Schema } from 'mongoose';
import { INotification, INotificationModal } from './notification.interface';
import paginate from '../../common/plugins/paginate';

const notificationModel = new Schema<INotification>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    subTitle: {
      type: String,
      required: [false, 'SubTitle is required'],
    },
    // message: {
    //   type: String,
    //   required: [true, 'Message is required'],
    // },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [false, 'User is required'],
    },
    // role: {
    //   type: String,
    //   enum: Roles,
    //   required: true,
    // },
    // image: {
    //   type: String,
    // },
    linkId: {
      type: String,
    },
    viewStatus: { 
      type: Boolean, 
      default: false
    },
  },
  { timestamps: true }
);

notificationModel.plugin(paginate);

export const Notification = model<INotification, INotificationModal>(
  'Notification',
  notificationModel
);
