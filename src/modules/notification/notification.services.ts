// import { ChatOpenAI } from '@langchain/openai';
import OpenAI from 'openai';
import { StatusCodes } from 'http-status-codes';
import { INotification } from './notification.interface';
import { Notification } from './notification.model';
import { User } from '../user/user.model';
import { PaginateOptions, PaginateResult } from '../../types/paginate';
import ApiError from '../../errors/ApiError';
import { FertieService } from '../fertie/fertie.service';
import { differenceInDays } from 'date-fns';

const model = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, //OPENAI_API_KEY // OPENROUTER_API_KEY
  // baseURL: 'https://openrouter.ai/api/v1',
  baseURL: 'https://api.openai.com/v1'
});

const addNotification = async (
  payload: INotification
): Promise<INotification> => {
  // Save the notification to the database
  const result = await Notification.create(payload);
  return result;
};

/**
 * 
 * may be we dont need send notification by cron job..  
 */
 const sendNotificationByChatGpt = async (userId : string): Promise<void> => {
 
    
    
    
    //////////////////////////////////////////////////////       
  }



const getALLNotification = async (
  filters: Partial<INotification>,
  options: PaginateOptions,
  userId: string
) => {
  filters.receiverId = userId;
  const unViewNotificationCount = await Notification.countDocuments({
    receiverId: userId,
    viewStatus: false,
  });

  const result = await Notification.paginate(filters, options);
  return { ...result, unViewNotificationCount };
};
/*
const getAdminNotifications = async (
  filters: Partial<INotification>,
  options: PaginateOptions
): Promise<PaginateResult<INotification>> => {
  filters.role = 'admin'; // Important SQL
  return Notification.paginate(filters, options);
};

const getSingleNotification = async (
  notificationId: string
): Promise<INotification | null> => {
  const result = await Notification.findById(notificationId);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }
  return result;
};

const addCustomNotification = async (
  eventName: string,
  notifications: INotification,
  userId?: string
) => {
  const messageEvent = `${eventName}::${userId}`;
  const result = await addNotification(notifications);

  if (eventName === 'admin-notification' && notifications.role === 'admin') {
    //@ts-ignore
    io.emit('admin-notification', {
      code: StatusCodes.OK,
      message: 'New notification',
      data: result,
    });
  } else {
    //@ts-ignore
    io.emit(messageEvent, {
      code: StatusCodes.OK,
      message: 'New notification',
      data: result,
    });
  }
  return result;
};

const viewNotification = async (notificationId: string) => {
  const result = await Notification.findByIdAndUpdate(
    notificationId,
    { viewStatus: true },
    { new: true }
  );
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }
  return result;
};
*/

/* /// Written by Sheakh

// Test korte hobe .. 
const deleteNotification = async (notificationId: string) => {
  const result = await Notification.findByIdAndDelete(notificationId);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }
  return result;
};

// Test korte hobe ... 
const clearAllNotification = async (userId: string) => {
  const user = await User.findById(userId);
  if (user?.role === 'projectManager') {
    const result = await Notification.deleteMany({ role: 'projectManager' });
    return result;
  }
  const result = await Notification.deleteMany({ receiverId: userId });
  return result;
};

*/
export const NotificationService = {
  addNotification,
  getALLNotification,
  sendNotificationByChatGpt
  // getAdminNotifications,
  // getSingleNotification,
  // addCustomNotification,
  // viewNotification,
  // deleteNotification,
  // clearAllNotification,
};
