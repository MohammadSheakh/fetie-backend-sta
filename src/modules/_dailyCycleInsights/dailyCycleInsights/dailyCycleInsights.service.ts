import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { GenericService } from '../../__Generic/generic.services';
import {
  IDailyCycleInsights,
  TDailyCycleInsights,
} from './dailyCycleInsights.interface';
import { DailyCycleInsights } from './dailyCycleInsights.model';

export class DailyCycleInsightsService extends GenericService<
  typeof DailyCycleInsights,
  IDailyCycleInsights
> {
  constructor() {
    super(DailyCycleInsights);
  }

 /* 
  // 🤖🤖🤖 client bad dise .. 
  //[🚧][🧑‍💻✅][🧪] // 🆗
  createByDateAndUserId = async (data: Partial<TDailyCycleInsights>) => {
    const res = await this.model.create(data);

    if (!res) {
      throw new Error('Database error while creating Daily Cycle Insights');
    }
    return res;
  };

  updateByDateAndUserId = async (
    data: Partial<TDailyCycleInsights>,
    populateAnySpecificField?: string
  ) => {
    const { date, userId } = data;
    let res;
    if(populateAnySpecificField){
      res = await this.model
      .findOneAndUpdate({ date, userId }, { $set: data }, { new: true })
      .populate(populateAnySpecificField);
    }else{
      res = await this.model
      .findOneAndUpdate({ date, userId }, { $set: data }, { new: true })
    }
    
    if (!res) {
      throw new Error('Failed to update Daily Cycle Insights');
    }
    return res;
  };

  // get by date and userId 🔥`eta develop korte hobe ..

  getByDateAndUserId = async (date: Date, userId: string) => {

    const dateObj = new Date(date);
    console.log('date from getByDateAndUserId 📅📅', dateObj, typeof dateObj); // 2025-05-06T00:00:00.000Z

    // Check if parsed date is valid
    // if (isNaN(date.getTime())) {
    //   throw new ApiError(StatusCodes.NOT_FOUND, 'Invalid date format');
    // }

    // Set start of the day (00:00:00.000)
    const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));

    // Set end of the day (23:59:59.999)
    const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));

    console.log('startOfDay and endOfDay📅', startOfDay, '📅', endOfDay , '📅'); 

    const res = await this.model.findOne({ date: { $gte: startOfDay, $lte: endOfDay }, userId }).populate('labTestLogId');
    console.log('res from 🟢 getByDateAndUserId 🟢', res);
    // if (!res) {
    //     throw new Error('Database error while getting Daily Cycle Insights By date And userId');
    // }
    return res;
  };


  // we need this in chatbot .. 
  getByUserId = async (userId: string) => {
    const res = await this.model.findOne({ userId }).populate('labTestLogId');
    console.log('res from 🟢 getByDateAndUserId 🟢', res);
    // if (!res) {
    //     throw new Error('Database error while getting Daily Cycle Insights By date And userId');
    // }
    return res;
  };

  */

  // Add more service here ..
}
