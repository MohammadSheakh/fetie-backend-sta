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
import { fromZonedTime } from 'date-fns-tz';
import { PersonalizeJourney } from '../../_personalizeJourney/personalizeJourney/personalizeJourney.model';
import { User } from '../../user/user.model';
import { differenceInDays } from 'date-fns';
import { TFertilityLevel, TPhase } from './dailyCycleInsights.constant';
import { FertieService } from '../../fertie/fertie.service';
import { IPersonalizeJourney } from '../../_personalizeJourney/personalizeJourney/personalizeJourney.interface';

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

    // console.log("personalizeJourney 🧪🧪🧪",personalizeJourney);

    if (!personalizeJourney) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'PersonalizeJourney not found'
      );
    }

  /*********** 
   * let cycleDay =
   *       differenceInDays(req.body.date, periodStartDate) + 1; // 🔰 req.body.date e hocche current date
   *********/

    let cycleDay = calculateCurrentCycleDay(
        new Date(),
        personalizeJourney.periodStartDate,
        Number(personalizeJourney.avgMenstrualCycleLength)
    );
    
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

    } else {
      let labTestLog = null;

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

      /************
       * 
       * cycle Day shob shomoy Daily cycle insight create korar shomoy add hobe 
       * cycle day kokhonoi Daily cycle insight update korar shomoy add hobe na ..
       * 
       * ************ */
      
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
    // console.log('🚧 DailyCycleInsightsController -> create -> userId', userId);
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

    const personalizeJourney :IPersonalizeJourney = await PersonalizeJourney.findById(user.personalize_Journey_Id).select(
      "periodStartDate periodLength periodEndDate avgMenstrualCycleLength"
    ).lean();

    const { periodStartDate, avgMenstrualCycleLength } =
        personalizeJourney;

    // console.log("personalizeJourney 🧪🧪🧪",personalizeJourney);

    if (!personalizeJourney) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'PersonalizeJourney not found'
      );
    }

    let cycleDay =
      calculateCurrentCycleDay(
        new Date(req.body.date),
        new Date(periodStartDate),
        Number(avgMenstrualCycleLength)
      );

    
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
   
    req.body.date = dateInUtc;

    if (dailyCycleInsightFound) {
      //> ekhane dailyCycleInsight Update korar code likhte hobe .. eta baki ase .. 
      const result = await this.dailyCycleInsightsService.updateById(
        dailyCycleInsightFound._id,
        req.body,
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

    } else {
      let labTestLog = null;

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

  updateByDate = catchAsync(async (req: Request, res: Response) => {
    const { date } = req.body;
    const userId = req.user.userId;
    
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

  /********
   * 
   * As per fahim vai's request 
   * 
   * ******** */
  getByDateAndUserId = catchAsync(async (req: Request, res: Response) => {
    const { date } = req.query;
    const userId = req.user.userId;
    
    req.body.userId = userId;

    const result = await this.dailyCycleInsightsService.getByDateAndUserId(
      date,
      userId
    );

    
    res.status(StatusCodes.OK).json({
      success: true,
      code: StatusCodes.OK,
      data: result,
      message: 'Daily Cycle Insights updated successfully',
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