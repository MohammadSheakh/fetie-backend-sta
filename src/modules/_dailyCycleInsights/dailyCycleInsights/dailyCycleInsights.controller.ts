import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../../__Generic/generic.controller';
import catchAsync from '../../../shared/catchAsync';
import ApiError from '../../../errors/ApiError';
import { DailyCycleInsights } from './dailyCycleInsights.model';
import {
  IDailyCycleInsights,
  TDailyCycleInsights,
} from './dailyCycleInsights.interface';
import { DailyCycleInsightsService } from './dailyCycleInsights.service';
import { LabTestLog } from '../labTestLog/labTestLog.model';

import { fromZonedTime } from 'date-fns-tz';
import { PersonalizeJourney } from '../../_personalizeJourney/personalizeJourney/personalizeJourney.model';
import { User } from '../../user/user.model';
import { differenceInDays } from 'date-fns';
import { TFertilityLevel, TPhase } from './dailyCycleInsights.constant';
import { Fertie } from '../../fertie/fertie.model';
import { FertieService } from '../../fertie/fertie.service';

const dailyCycleInsightsService = new DailyCycleInsightsService();

export class DailyCycleInsightsController extends GenericController<
  typeof DailyCycleInsights,
  IDailyCycleInsights
> {
  // private stripe: Stripe;
  dailyCycleInsightsService = new DailyCycleInsightsService();
  fertieService = new FertieService();

  constructor() {
    super(new DailyCycleInsightsService(), 'Daily Cycle Insights');
    // Initialize Stripe with secret key (from your Stripe Dashboard)
    // this.stripe = new Stripe('your_stripe_secret_key');
  }

  

  //[🚧][🧑‍💻✅][🧪] // 🆗
  /********
   *  //> This create method has issue like calculating cycle day ... 
   * 
   * ********* */
  createWithIssue = catchAsync(async (req: Request, res: Response) => {
    const {
      activity,
      cervicalMucus,
      //cycleDay, // auto calculate hobe .. 
      date,
      fertilityLevel,
      menstrualFlow,
      mood,
      //phase, // phase auto calculate hobe ..
      symptoms,
      labTestName,
      labTestValue,
    }: TDailyCycleInsights = req.body;
    const userId = req.user.userId;
    console.log('🚧 DailyCycleInsightsController -> create -> userId', userId);
    req.body.userId = userId;

    const user = await User.findById(userId).select('personalize_Journey_Id').lean();

    if (!user) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'User not found'
      );
    }
    if (!user.personalize_Journey_Id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'User does not have a personalize journey'
      );
    }

    // Get PersonalizeJourney for ⚡periodStartDate  ⚡avgMenstrualCycleLength 

    const personalizeJourney = await PersonalizeJourney.findById(user.personalize_Journey_Id).select(
      "periodStartDate periodLength periodEndDate avgMenstrualCycleLength"
    ).lean();

    console.log("personalizeJourney 🧪🧪🧪",personalizeJourney);

    if (!personalizeJourney) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'PersonalizeJourney not found'
      );
    }

    /////////////////////////////////////////////////////////////////////////////


    ////*********** calculate cycle day */

    /*
    // 1. Get today's date as milliseconds since the Unix Epoch using JavaScript's Date.now()
    const today = Date.now(); // This gives the current timestamp in milliseconds
    console.log("Today's timestamp:", today);

    // 2. Ensure periodStartDate is a Date object and convert it to milliseconds
    const periodStartDate = new Date(personalizeJourney.periodStartDate).getTime(); // Convert to milliseconds
    console.log("Period start date timestamp:", periodStartDate);

    // 3. Calculate the time difference in milliseconds
    const timeDifference = today - periodStartDate;  // in milliseconds

    // 4. Convert milliseconds to days
    const cycleDay = Math.floor(timeDifference / (1000 * 60 * 60 * 24)) + 1; // Add 1 to include the first day of the period

    console.log("Current cycle day:", cycleDay);
    */

    const currentDate = new Date(); // Current date and time

    console.log("periodStartDate 🧪", personalizeJourney?.periodStartDate);
    console.log("req.body.date 🧪", req.body.date);

    ///////// Predict Period Start Date based on 12 months of predicted Data ..  ///////////////// START

    let data = await this.fertieService.predictAllDates(userId);


    console.log("data 🧪🧪🧪🧪🧪🧪 predicAllDates", data);

    // Extract year and month from the target date
  const [year, month] = req.body.date.split('-');
  const targetYearMonth = `${year}-${month}`;
  
  // Find the month object that matches the target year-month
  const monthData = data.find(item => item.month === targetYearMonth);

  console.log("monthData 🧪🧪🧪", monthData);
  
  if (!monthData) {
    return { error: `No data found for month: ${targetYearMonth}`};
  }
  
  // Extract period start date for the found month
  const periodEvent = monthData.events.find(event => event.predictedPeriodStart);
  

  console.log("periodEvent 🧪🧪🧪", periodEvent);
  if (!periodEvent) {
    // return { error: `No period data found for month: ${targetYearMonth}` };
    throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `No period data found for month: ${targetYearMonth}`
      );
  }
  
  // Format the date to YYYY-MM-DD
  const periodStartDate = periodEvent.predictedPeriodStart//.split('T')[0];

    ///////// Predict Period Start Date based on 12 months of predicted Data ..  ///////////////// END


    let cycleDay =
          differenceInDays(req.body.date, periodStartDate) + 1; // 🔰 req.body.date e hocche current date
    

    console.log("cycleDay 🧪", cycleDay);

    /////////////////////////////////////////////////////////////////////////////
    const dailyCycleInsightFound =
      await this.dailyCycleInsightsService.getByDateAndUserId(
        req.body.date,
        userId
    );

    // Specify the user's timezone. For example, 'America/New_York', but this can be dynamic depending on the user.
    const userTimezone = 'America/New_York'; // You can replace this with the actual user's timezone.
    
    // Convert the local time to UTC
    const dateInUserTimezone = new Date(req.body.date); // Create a Date object from the input string
    // console.log("dateInUserTimezone 🧪", dateInUserTimezone);
    const dateInUtc = fromZonedTime(dateInUserTimezone, userTimezone);
    
    // console.log("dateInUtc 🧪", dateInUtc);

    // Now you can save this UTC date to your database // 🔥🔥 UTC format bad diye may be ISO format use korte hobe ... 
    req.body.date = dateInUtc;

    if (dailyCycleInsightFound) {

      /************************** 
       * // 🤖 client remove this

      let labTestLog = null;
      if (labTestName && labTestValue) {
        let possibleLabTestNames = [
          'follicleStimulatingHormoneTest',
          'luteinizingHormoneTest',
          'estradiolTest',
          'progesteroneTest',
          'antiMullerianHormoneTest',
          'thyroidStimulatingHormoneTest',
          'prolactinTest',
        ];

        if (!possibleLabTestNames.includes(labTestName)) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Invalid lab test name provided. it can be one of the following: ${possibleLabTestNames.join(
              ', '
            )}`
          );
        }

        // Check if the lab test log already exists for the user and date
        const existingLabTestLog = await LabTestLog.findOne({
          _id: dailyCycleInsightFound.labTestLogId,
        });
        if (!existingLabTestLog) {
          labTestLog = await LabTestLog.create({
            userId: userId,
            [labTestName]: labTestValue,
          });
          req.body.labTestLogId = labTestLog._id;
        } else {
          // update the existing lab test log with the new value
          await LabTestLog.updateOne(
            {
              _id: existingLabTestLog._id,
            },
            {
              [labTestName]: labTestValue,
            },
            {
              new: true,
            }
          );
        }
      }

      const result = await this.dailyCycleInsightsService.updateByDateAndUserId(
        req.body,
        'labTestLogId' // populateAnySpecificField
      );


      res.status(StatusCodes.OK).json({
        success: true,
        code: StatusCodes.OK,
        data: result,
        message: 'Daily Cycle Insights updated successfully',
      });


      **************************************************/

    } else {
      let labTestLog = null;

      

      /************************************************** 
       * // 🤖 client remove this 
       * 
      if (labTestName && labTestValue) {
        let possibleLabTestNames = [
          'follicleStimulatingHormoneTest',
          'luteinizingHormoneTest',
          'estradiolTest',
          'progesteroneTest',
          'antiMullerianHormoneTest',
          'thyroidStimulatingHormoneTest',
          'prolactinTest',
        ];

        if (!possibleLabTestNames.includes(labTestName)) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Invalid lab test name provided. it can be one of the following: ${possibleLabTestNames.join(
              ', '
            )}`
          );
        }

        labTestLog = await LabTestLog.create({
          userId: userId,
          [labTestName]: labTestValue,
        });
        req.body.labTestLogId = labTestLog._id;
      }

      ********************************************************/


      /**
       * 
       * based on provided information, we have to calculate Fertility Score
       * 
       * we have information like :
       *  menstrualFlow, mood, activity, symptoms, cervicalMucus
       *  all lab tests.. specially LH test between cycle day 2-5
       * 
       * we need information like : 
       * phase, fertilityLevel, cycleDay🟢 
       * 
       * we need information like : 
       * 
       * period start Date,  average cycle length, 
       * luteal phase length
       * 
       * // from our information we have to know .. 
       * date of intercourse, timing relative to ovulation
       * 
       */

      req.body.cycleDay = cycleDay  

      let phase = '';
      let fertilityLevel = '';
      if (cycleDay <= 5) {
        phase = TPhase.menstrual ; // 'Menstrual'
        fertilityLevel = TFertilityLevel.veryLow ; // 'Very Low'
      } else if (cycleDay <= 13) {
        phase = TPhase.follicular ; // 'Follicular'
        fertilityLevel = TFertilityLevel.low ; // 'Low to Medium' 🔥 Condition ta pore check korte hobe .. 
      } else if (cycleDay === 14) {
        phase = TPhase.ovulatory ; // 'Ovulatory'
        fertilityLevel = TFertilityLevel.veryHigh ; // 'Very High'
      } else if (
        cycleDay <= Number(personalizeJourney?.avgMenstrualCycleLength)
      ) {
        phase = TPhase.luteal ; // 'Luteal'
        fertilityLevel = TFertilityLevel.low ; // 'Low'
      } else {
        phase = 'Unknown';
        fertilityLevel = 'Unknown';
      }

      req.body.phase = phase;
      req.body.fertilityLevel = fertilityLevel;

      // cycle Day shob shomoy Daily cycle insight create korar shomoy add hobe 
      // cycle day kokhonoi Daily cycle insight update korar shomoy add hobe na .. 
      

      const result = await this.dailyCycleInsightsService.createByDateAndUserId(
        req.body
      );

      if (!result) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Failed to create Daily Cycle Insights'
        );
      }
      res.status(StatusCodes.CREATED).json({
        success: true,
        code: StatusCodes.CREATED,
        data: result,
        message: 'Daily Cycle Insights created successfully',
      });
    }
  });


  /********
   *  //> Lets try to fix calculating cycle day issue .. 
   * 
   * ********* */
  create = catchAsync(async (req: Request, res: Response) => {
    const {
      activity,
      cervicalMucus,
      //cycleDay, // auto calculate hobe .. 
      date,
      fertilityLevel,
      menstrualFlow,
      mood,
      //phase, // phase auto calculate hobe ..
      symptoms,
    }: TDailyCycleInsights = req.body;
    const userId = req.user.userId;
    console.log('🚧 DailyCycleInsightsController -> create -> userId', userId);
    req.body.userId = userId;

    const user = await User.findById(userId).select('personalize_Journey_Id').lean();

    if (!user) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'User not found'
      );
    }
    if (!user.personalize_Journey_Id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'User does not have a personalize journey'
      );
    }

    // Get PersonalizeJourney for ⚡periodStartDate  ⚡avgMenstrualCycleLength 

    const personalizeJourney = await PersonalizeJourney.findById(user.personalize_Journey_Id).select(
      "periodStartDate periodLength periodEndDate avgMenstrualCycleLength"
    ).lean();

    console.log("personalizeJourney 🧪🧪🧪",personalizeJourney);

    if (!personalizeJourney) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'PersonalizeJourney not found'
      );
    }

    /////////////////////////////////////////////////////////////////////////////


    ////*********** calculate cycle day */

    /*
    // 1. Get today's date as milliseconds since the Unix Epoch using JavaScript's Date.now()
    const today = Date.now(); // This gives the current timestamp in milliseconds
    console.log("Today's timestamp:", today);

    // 2. Ensure periodStartDate is a Date object and convert it to milliseconds
    const periodStartDate = new Date(personalizeJourney.periodStartDate).getTime(); // Convert to milliseconds
    console.log("Period start date timestamp:", periodStartDate);

    // 3. Calculate the time difference in milliseconds
    const timeDifference = today - periodStartDate;  // in milliseconds

    // 4. Convert milliseconds to days
    const cycleDay = Math.floor(timeDifference / (1000 * 60 * 60 * 24)) + 1; // Add 1 to include the first day of the period

    console.log("Current cycle day:", cycleDay);
    */

    const currentDate = new Date(); // Current date and time

    console.log("periodStartDate 🧪", personalizeJourney?.periodStartDate);
    console.log("req.body.date 🧪", req.body.date);

    ///////// Predict Period Start Date based on 12 months of predicted Data ..  ///////////////// START

    let data = await this.fertieService.predictAllDates(userId);


    console.log("data 🧪🧪🧪🧪🧪🧪 predicAllDates", data);

    // Extract year and month from the target date
  const [year, month] = req.body.date.split('-');
  const targetYearMonth = `${year}-${month}`;
  
  // Find the month object that matches the target year-month
  const monthData = data.find(item => item.month === targetYearMonth);

  console.log("monthData 🧪🧪🧪", monthData);
  
  if (!monthData) {
    return { error: `No data found for month: ${targetYearMonth}`};
  }
  
  // Extract period start date for the found month
  const periodEvent = monthData.events.find(event => event.predictedPeriodStart);
  

  console.log("periodEvent 🧪🧪🧪", periodEvent);
  if (!periodEvent) {
    // return { error: `No period data found for month: ${targetYearMonth}` };
    throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `No period data found for month: ${targetYearMonth}`
      );
  }
  
  // Format the date to YYYY-MM-DD
  const periodStartDate = periodEvent.predictedPeriodStart//.split('T')[0];

    ///////// Predict Period Start Date based on 12 months of predicted Data ..  ///////////////// END


    /**********************
    let cycleDay =
          differenceInDays(req.body.date, periodStartDate) + 1; // 🔰 req.body.date e hocche current date
    
    ********************/

    let cycleDay =
          calculateCurrentCycleDay(
            new Date(req.body.date),
            new Date(periodStartDate),
            personalizeJourney?.avgMenstrualCycleLength
          );

    console.log("cycleDay 🧪", cycleDay);

    /////////////////////////////////////////////////////////////////////////////
    const dailyCycleInsightFound =
      await this.dailyCycleInsightsService.getByDateAndUserId(
        req.body.date,
        userId
    );

    // Specify the user's timezone. For example, 'America/New_York', but this can be dynamic depending on the user.
    const userTimezone = 'America/New_York'; // You can replace this with the actual user's timezone.
    
    // Convert the local time to UTC
    const dateInUserTimezone = new Date(req.body.date); // Create a Date object from the input string
    // console.log("dateInUserTimezone 🧪", dateInUserTimezone);
    const dateInUtc = fromZonedTime(dateInUserTimezone, userTimezone);
    
    // console.log("dateInUtc 🧪", dateInUtc);

    // Now you can save this UTC date to your database // 🔥🔥 UTC format bad diye may be ISO format use korte hobe ... 
    req.body.date = dateInUtc;

    if (dailyCycleInsightFound) {
      //> ekhane dailyCycleInsight Update korar code likhte hobe .. eta baki ase .. 
    } else {
      let labTestLog = null;

      req.body.cycleDay = cycleDay   //> 🌀🌀🌀🌀🌀🌀🌀 ekhane issue ase .. 

      let phase = '';
      let fertilityLevel = '';
      if (cycleDay <= 5) {
        phase = TPhase.menstrual ; // 'Menstrual'
        fertilityLevel = TFertilityLevel.veryLow ; // 'Very Low'
      } else if (cycleDay <= 13) {
        phase = TPhase.follicular ; // 'Follicular'
        fertilityLevel = TFertilityLevel.low ; // 'Low to Medium' 🔥 Condition ta pore check korte hobe .. 
      } else if (cycleDay === 14) {
        phase = TPhase.ovulatory ; // 'Ovulatory'
        fertilityLevel = TFertilityLevel.veryHigh ; // 'Very High'
      } else if (
        cycleDay <= Number(personalizeJourney?.avgMenstrualCycleLength)
      ) {
        phase = TPhase.luteal ; // 'Luteal'
        fertilityLevel = TFertilityLevel.low ; // 'Low'
      } else {
        phase = 'Unknown';
        fertilityLevel = 'Unknown';
      }

      req.body.phase = phase;
      req.body.fertilityLevel = fertilityLevel;

      // cycle Day shob shomoy Daily cycle insight create korar shomoy add hobe 
      // cycle day kokhonoi Daily cycle insight update korar shomoy add hobe na .. 
      

      const result = await this.dailyCycleInsightsService.createByDateAndUserId(
        req.body
      );

      if (!result) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Failed to create Daily Cycle Insights'
        );
      }
      res.status(StatusCodes.CREATED).json({
        success: true,
        code: StatusCodes.CREATED,
        data: result,
        message: 'Daily Cycle Insights created successfully',
      });
    }
  });

  updateByDate = catchAsync(async (req: Request, res: Response) => {
    const { date } = req.body;
    const userId = req.user.userId;
    console.log(
      '🚧 DailyCycleInsightsController -> updateByDate -> userId',
      userId
    );
    req.body.userId = userId;

    const result = await this.dailyCycleInsightsService.updateByDateAndUserId(
      req.body
    );

    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to update Daily Cycle Insights'
      );
    }
    res.status(StatusCodes.OK).json({
      success: true,
      code: StatusCodes.OK,
      data: result,
      message: 'Daily Cycle Insights updated successfully',
    });
  });


  
  //[🚧][🧑‍💻][🧪] // ✅ 🆗  // 🔴🔴 not working ..  
  getByDateAndUserId = catchAsync(async (req: Request, res: Response) => {
    const { date } = req.query;
    const userId = req.user.userId;
    console.log("hit ")
/*
    const result = await this.dailyCycleInsightsService.getByDateAndUserId(
      date,
      userId
    );

    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to get Daily Cycle Insights'
      );
    }
*/
    res.status(StatusCodes.OK).json({
      success: true,
      code: StatusCodes.OK,
      data: null,
      message: 'Daily Cycle Insights fetched successfully',
    });
  });

  // add more methods here if needed or override the existing ones
}


// Helper function to calculate current cycle day
function calculateCurrentCycleDay(
  currentDate: Date,
  baseDate: Date ,
  avgCycleLength: number
): number {
  const daysSinceBase = Math.floor(
    (currentDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceBase < 0) {
    // Current date is before the base date
    return 1;
  }

  // Calculate which cycle we're in and what day of that cycle
  const cycleDay = (daysSinceBase % avgCycleLength) + 1;

  return cycleDay;
}