import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../__Generic/generic.controller';
import catchAsync from '../../shared/catchAsync';
import ApiError from '../../errors/ApiError';
import { differenceInDays }  from 'date-fns' ;
import { FertieService } from './fertie.service';
import { Fertie } from './fertie.model';
import { IFertie } from './fertie.interface';
import { PersonalizedJourneyService } from '../_personalizeJourney/personalizeJourney/personalizeJourney.service';
import { DailyCycleInsightsService } from '../dailyCycleInsights/dailyCycleInsights.service';


const personalizedJourneyService = new PersonalizedJourneyService();
const dailyCycleInsightsService = new DailyCycleInsightsService();


export class FertieController extends GenericController<
  typeof Fertie,
  IFertie
> {
  // private stripe: Stripe;
  fertieService = new FertieService();

  constructor() {
    super(new FertieService(), 'Fertie');
    // Initialize Stripe with secret key (from your Stripe Dashboard)
    // this.stripe = new Stripe('your_stripe_secret_key');
  }

  //[🚧][🧑‍💻✅][🧪] // 🆗
  getHomePageDataByDate = catchAsync(
    async (req: Request, res: Response) => {
      const { date } :any = req.query; // 12-12-2023
      const userId = req.user.userId;

      

      /**
       * get
       * periodStartDate, periodLength, periodEndDate , avgMenstrualCycleLength
       * expectedPeriodStartDate , predictedOvulationDate, 
       * 
       * from personalized Journey 
       * 
       * By date and userId
       */

      /**
       * get
       * menstrualFlow, mood, activity, symptoms, phase , cervicalMucus
       * 
       * 
       * generate 
       * fertilityLevel , cycleDay , 
       * 
       * from dailyCycleInsights
       * 
       * By date and userId
       */

      const personalizedJourney = await personalizedJourneyService.getByDateAndUserId(date, userId);
      const dailyCycleInsights = await dailyCycleInsightsService.getByDateAndUserId(date, userId);

      console.log('personalizedJourney 🔥', personalizedJourney);
      console.log('dailyCycleInsights 🔥', dailyCycleInsights);


      

// Step 1: Current Date
const currentDate = new Date(); // Current date and time

// const expectedPeriodStartDate = new Date('2025-05-20T00:00:00.000Z');

// Step 3: Calculate the difference in days
  const daysLeftForNextPeriodStart = differenceInDays(personalizedJourney?.expectedPeriodStartDate, currentDate);

  const daysLeftForNextOvulationDate = differenceInDays(personalizedJourney?.predictedOvulationDate, currentDate);

  console.log(`daysLeftForNextPeriodStart: ${daysLeftForNextPeriodStart}`);
  console.log(`daysLeftForNextOvulationDate: ${daysLeftForNextOvulationDate}`);

  // phase , fertility , cycle day 🔥 egula niye chinta korte hobe ... 
  

  // console.log("cycle day 🔥", )

  let cycleDay = differenceInDays( currentDate , personalizedJourney?.periodStartDate)+1;

  //  dailyCycleInsights.cycleDay = cycleDay; // can not set cycle day .. because it might be happen that for some day we have not dailyCycleInsight

  // based on avgMenstrualCycleLength and cycle day .. i have to calculate phase and fertility level
  // write a function to calculate phase and fertility level based on cycle day and avgMenstrualCycleLength
  let phase = '';
  let fertilityLevel = '';
  if (cycleDay <=  Number(personalizedJourney?.avgMenstrualCycleLength)) {
    phase = 'Follicular Phase';
    if (cycleDay <= 7) {
      fertilityLevel = 'Low';
    } else if (cycleDay <= 14) {
      fertilityLevel = 'Medium';
    } else {
      fertilityLevel = 'High';
    }
  } else if (cycleDay <= Number(personalizedJourney?.avgMenstrualCycleLength) + 14) {
    phase = 'Ovulatory Phase';
    fertilityLevel = 'High';
  } else {
    phase = 'Luteal Phase';
    if (cycleDay <= Number(personalizedJourney?.avgMenstrualCycleLength) + 21) {
      fertilityLevel = 'Medium';
    } else {
      fertilityLevel = 'Low';
    }
  }

  

  // dont need to provide all information .. just selective infomation .. 
  let finalData = {
    ...personalizedJourney._doc,
    ...dailyCycleInsights._doc,
    cycleDay,
    daysLeftForNextPeriodStart,
    daysLeftForNextOvulationDate,
    phase,
    fertilityLevel
  }
      
      res.status(StatusCodes.OK).json({
        success: true,
        code : StatusCodes.OK,
        data: finalData,
        message: 'Fertie Ok successfully',
      });

  })







  // add more methods here if needed or override the existing ones
}