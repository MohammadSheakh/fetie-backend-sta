import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../__Generic/generic.controller';
import catchAsync from '../../shared/catchAsync';
import ApiError from '../../errors/ApiError';
import { differenceInDays } from 'date-fns';
import { FertieService } from './fertie.service';
import { Fertie } from './fertie.model';
import { IFertie } from './fertie.interface';
import { PersonalizedJourneyService } from '../_personalizeJourney/personalizeJourney/personalizeJourney.service';
import { DailyCycleInsightsService } from '../_dailyCycleInsights/dailyCycleInsights/dailyCycleInsights.service';
import { PersonalizeJourney } from '../_personalizeJourney/personalizeJourney/personalizeJourney.model';
import { User } from '../user/user.model';
import { DailyCycleInsights } from '../_dailyCycleInsights/dailyCycleInsights/dailyCycleInsights.model';

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
  getHomePageDataByDate = catchAsync(async (req: Request, res: Response) => {
    const { date }: any = req.query; // 12-12-2023
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
     * menstrualFlow, mood, activity, symptoms, cervicalMucus
     *
     *
     * generate
     * fertilityLevel , cycleDay , phase
     *
     * confusion ... phase ki get korbo naki generate korbo ..
     *
     * from dailyCycleInsights
     *
     * By date and userId
     */

    const personalizedJourney = await personalizedJourneyService.getByUserId(
      userId
    );
    const dailyCycleInsights =
      await dailyCycleInsightsService.getByDateAndUserId(date, userId);

    console.log('personalizedJourney 🔥', personalizedJourney);
    console.log('dailyCycleInsights 🔥', dailyCycleInsights);

    // Step 1: Current Date
    const currentDate = new Date(); // Current date and time

    // const expectedPeriodStartDate = new Date('2025-05-20T00:00:00.000Z');

    // Step 3: Calculate the difference in days // 🟢🟢🟢🟢🟢
    const daysLeftForNextPeriodStart = differenceInDays(
      personalizedJourney?.expectedPeriodStartDate,
      currentDate
    );

    const daysLeftForNextOvulationDate = differenceInDays(
      personalizedJourney?.predictedOvulationDate,
      currentDate
    );

    console.log(`daysLeftForNextPeriodStart: ${daysLeftForNextPeriodStart}`);
    console.log(
      `daysLeftForNextOvulationDate: ${daysLeftForNextOvulationDate}`
    );

    // phase , fertility , cycle day 🔥 egula niye chinta korte hobe ...

    // console.log("cycle day 🔥", )

    let cycleDay =
      differenceInDays(currentDate, personalizedJourney?.periodStartDate) + 1;

    //  dailyCycleInsights.cycleDay = cycleDay; // can not set cycle day .. because it might be happen that for some day we have not dailyCycleInsight

    // based on avgMenstrualCycleLength and cycle day .. i have to calculate phase and fertility level
    // write a function to calculate phase and fertility level based on cycle day and avgMenstrualCycleLength
    let phase = '';
    let fertilityLevel = '';
    if (cycleDay <= 5) {
      phase = 'Menstrual';
      fertilityLevel = 'Very Low';
    } else if (cycleDay <= 13) {
      phase = 'Follicular';
      fertilityLevel = 'Low to Medium';
    } else if (cycleDay === 14) {
      phase = 'Ovulatory';
      fertilityLevel = 'Very High';
    } else if (
      cycleDay <= Number(personalizedJourney?.avgMenstrualCycleLength)
    ) {
      phase = 'Luteal';
      fertilityLevel = 'Low';
    } else {
      phase = 'Unknown';
      fertilityLevel = 'Unknown';
    }

    // dont need to provide all information .. just selective infomation ..

    let finalData;

    if (personalizedJourney && dailyCycleInsights) {
      finalData = {
        ...personalizedJourney._doc,
        ...dailyCycleInsights._doc,
        cycleDay,
        daysLeftForNextPeriodStart,
        daysLeftForNextOvulationDate,
        phase,
        fertilityLevel,
      };
    } else {
      finalData = {
        ...personalizedJourney._doc,
        // ...dailyCycleInsights._doc,
        cycleDay,
        daysLeftForNextPeriodStart,
        daysLeftForNextOvulationDate,
        phase,
        fertilityLevel,
      };
    }

    res.status(StatusCodes.OK).json({
      success: true,
      code: StatusCodes.OK,
      data: finalData,
      message: 'Fertie Ok successfully',
    });
  });

  //[🚧][🧑‍💻✅][🧪] // 🆗
  getPredictionsByMonth = catchAsync(
    async (req: Request, res: Response) => {
      const userId = req.user.userId;
      const monthQuery: any = req.query.month; // optional

      const user = await User.findById(userId);

      const journey = await PersonalizeJourney.findById(
        user?.personalize_Journey_Id
      );
      if (!journey) return res.status(404).json({ error: 'Journey not found' });

      const { periodStartDate, periodLength, avgMenstrualCycleLength } =
        journey;
      const today = new Date();
      const startMonth = monthQuery ? new Date(`${monthQuery}-01`) : today;

      const predictions = [];

      for (let i = 0; i < 12; i++) {
        const monthDate = new Date(startMonth);
        monthDate.setMonth(monthDate.getMonth() + i); // Move i months forward

        const startDate = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          1
        );
        const endDate = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          1
        );

        // --------------- Fetch DailyCycleInsights for this month ----------------
        const insights = await DailyCycleInsights.find({
          userId,
          date: { $gte: startDate, $lt: endDate },
        }).lean();

        const formattedData: any = {};

        insights.forEach(entry => {
          const dateKey = entry.date
            .toISOString()
            .slice(0, 10)
            .split('-')
            .reverse()
            .join('-'); // DD-MM-YYYY

          const {
            menstrualFlow,
            phase,
            // mood,
            // activity,
            // symptoms,
            // fertilityLevel,
            // cycleDay,
            // cervicalMucus,
          } = entry;

          formattedData[dateKey] = {};

          if (menstrualFlow)
            formattedData[dateKey].menstrualFlow = menstrualFlow;
          if (phase) formattedData[dateKey].phase = phase;
          // if (mood) formattedData[dateKey].mood = mood;
          // if (activity) formattedData[dateKey].activity = activity;
          // if (symptoms?.length) formattedData[dateKey].symptoms = symptoms;
          // if (fertilityLevel)
          //   formattedData[dateKey].fertilityLevel = fertilityLevel;
          // if (typeof cycleDay === 'number')
          //   formattedData[dateKey].cycleDay = cycleDay;
          // if (cervicalMucus)
          //   formattedData[dateKey].cervicalMucus = cervicalMucus;
        });
        // --------------------------------------------------------------------------

        const predictedStart = new Date(periodStartDate);
        predictedStart.setDate(
          predictedStart.getDate() + i * Number(avgMenstrualCycleLength)
        );

        const predictedEnd = new Date(predictedStart);
        predictedEnd.setDate(predictedEnd.getDate() + Number(periodLength) - 1);

        const ovulation = new Date(predictedStart);
        ovulation.setDate(
          ovulation.getDate() + Math.floor(Number(avgMenstrualCycleLength) / 2)
        );

        const fertileStart = new Date(ovulation);
        fertileStart.setDate(fertileStart.getDate() - 3);

        const fertileEnd = new Date(ovulation);
        fertileEnd.setDate(fertileEnd.getDate() + 1);

        predictions.push({
          month: `${monthDate.getFullYear()}-${String(
            monthDate.getMonth() + 1
          ).padStart(2, '0')}`, // e.g., "2025-06"
          predictedPeriodStart: predictedStart,
          predictedPeriodEnd: predictedEnd,
          predictedOvulationDate: ovulation,
          fertileWindow: [fertileStart, fertileEnd],
          dailyLogs: formattedData, // ✅ Attach the daily logs here
        });
      }

      res.status(StatusCodes.OK).json({
        success: true,
        code: StatusCodes.OK,
        data: predictions,
        message: 'Fertile Ok successfully',
      });
    }
  );

  getMonthlyDailyCycleInsightsByMonth = catchAsync(
    async (req: Request, res: Response) => {
      const userId = req.user.userId;
      const { month } = req.query; // e.g., "2025-06"
      if (!month) {
        return res.status(400).json({ error: 'Month is required' });
      }

      const [year, mon] = month.split('-').map(Number);

      const startDate = new Date(year, mon - 1, 1);
      const endDate = new Date(year, mon, 1); // first day of next month

      const insights = await DailyCycleInsights.find({
        userId,
        date: { $gte: startDate, $lt: endDate },
      }).lean().populate('labTestLogId');

      console.log('insights', insights);

      const formattedData: any = {};

      insights.forEach(entry => {
        const dateKey = entry.date
          .toISOString()
          .slice(0, 10)
          .split('-')
          .reverse()
          .join('-'); // DD-MM-YYYY

        // Pick only non-null/undefined fields you care to show
        const { menstrualFlow,
          mood,
          activity,
          symptoms,
           phase,
           fertilityLevel,
           cycleDay,
           cervicalMucus,
           date,
           labTestLogId
           } = entry;

        formattedData[dateKey] = {};

        if (menstrualFlow) formattedData[dateKey].menstrualFlow = menstrualFlow;
        if (phase) formattedData[dateKey].phase = phase;

        if (mood) formattedData[dateKey].mood = mood;
        if (activity) formattedData[dateKey].activity = activity;
        if (symptoms) formattedData[dateKey].symptoms = symptoms;
        if (fertilityLevel) formattedData[dateKey].fertilityLevel = fertilityLevel;
        if (cycleDay) formattedData[dateKey].cycleDay = cycleDay;
        if (cervicalMucus) formattedData[dateKey].cervicalMucus = cervicalMucus;
        if (date) formattedData[dateKey].date = date;
        if (labTestLogId) formattedData[dateKey].labTestLogId = labTestLogId;
      });

      res.status(StatusCodes.OK).json({
        success: true,
        code: StatusCodes.OK,
        data: formattedData,
        message: 'Fertie Ok successfully',
      });
    }
  );

  getDailyDailyCycleInsightsByDate = catchAsync(
    async (req: Request, res: Response) => {
      const userId = req.user.userId;
      const { date } = req.query; // e.g., "2025-05-04"
      if (!date) {
        return res.status(400).json({ error: 'date is required' });
      }

      let dateObj = new Date(date); // .toISOString()

      console.log("dateObj 📅📅", dateObj);

      // Set start of the day (00:00:00.000)
    const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));

    // Set end of the day (23:59:59.999)
    const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));
      

      const insights = await DailyCycleInsights.find({
        userId,
        date: { $gte: startOfDay, $lt: endOfDay },
      }).lean().populate('labTestLogId');

      console.log('insights', insights);

      const formattedData: any = {};

      insights.forEach(entry => {
        const dateKey = entry.date
          .toISOString()
          .slice(0, 10)
          .split('-')
          .reverse()
          .join('-'); // DD-MM-YYYY

        // Pick only non-null/undefined fields you care to show
        const { menstrualFlow,
          mood,
          activity,
          symptoms,
           phase,
           fertilityLevel,
           cycleDay,
           cervicalMucus,
           date,
           labTestLogId
           } = entry;

        formattedData[dateKey] = {};

        if (menstrualFlow) formattedData[dateKey].menstrualFlow = menstrualFlow;
        if (phase) formattedData[dateKey].phase = phase;

        if (mood) formattedData[dateKey].mood = mood;
        if (activity) formattedData[dateKey].activity = activity;
        if (symptoms) formattedData[dateKey].symptoms = symptoms;
        if (fertilityLevel) formattedData[dateKey].fertilityLevel = fertilityLevel;
        if (cycleDay) formattedData[dateKey].cycleDay = cycleDay;
        if (cervicalMucus) formattedData[dateKey].cervicalMucus = cervicalMucus;
        if (date) formattedData[dateKey].date = date;
        if (labTestLogId) formattedData[dateKey].labTestLogId = labTestLogId;
      });

      res.status(StatusCodes.OK).json({
        success: true,
        code: StatusCodes.OK,
        data: formattedData,
        message: 'Fertie Ok successfully',
      });
    }
  );

  // add more methods here if needed or override the existing ones
}


  /*
  
  updateFertilityScore = catchAsync(
    async (req: Request, res: Response) => {
      const userId = req.user.userId;

      const fertilityScoreData = await this.fertieService.calculateFertilityScore(userId);

      // update todays entry with the new score 

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      
        // await DailyCycleInsights.findOrCreate({
        //   where: {
        //     user_id: userId,
        //     date: today
        //   },
        //   defaults: {
        //     dailyFertilityScore: fertilityScoreData.fertilityScore,
        //     // Set other default values as needed
        //   }
        // });

        // await DailyCycleInsights.update(
        //   { dailyFertilityScore: fertilityScoreData.fertilityScore },
        //   { 
        //     where: { 
        //       user_id: userId,
        //       date: today
        //     }
        //   }
        // );
      
    
    res.status(StatusCodes.OK).json({
        success: true,
        code: StatusCodes.OK,
        data: fertilityScoreData,
        message: 'Fertility score ',
      });

  })

  */

/*

getPredictionsByMonth = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const month = req.query.month; // optional

    const user = await User.findById(userId);

    const journey = await PersonalizeJourney.findById(
      user?.personalize_Journey_Id
    );
    if (!journey) return res.status(404).json({ error: 'Journey not found' });

    const { periodStartDate, periodLength, avgMenstrualCycleLength } = journey;
    const today = new Date();
    const startMonth = month ? new Date(`${month}-01`) : today;

    const predictions = [];

    for (let i = 0; i < 12; i++) {
      const predictedStart = new Date(periodStartDate);
      predictedStart.setDate(
        predictedStart.getDate() + i * Number(avgMenstrualCycleLength)
      );

      const predictedEnd = new Date(predictedStart);
      predictedEnd.setDate(predictedEnd.getDate() + Number(periodLength) - 1);

      const ovulation = new Date(predictedStart);
      ovulation.setDate(
        ovulation.getDate() + Math.floor(Number(avgMenstrualCycleLength) / 2)
      );

      const fertileStart = new Date(ovulation);
      fertileStart.setDate(fertileStart.getDate() - 3);

      const fertileEnd = new Date(ovulation);
      fertileEnd.setDate(fertileEnd.getDate() + 1);

      predictions.push({
        month: predictedStart.toISOString().slice(0, 7),
        predictedPeriodStart: predictedStart,
        predictedPeriodEnd: predictedEnd,
        predictedOvulationDate: ovulation,
        fertileWindow: [fertileStart, fertileEnd],
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      code: StatusCodes.OK,
      data: predictions,
      message: 'Fertie Ok successfully',
    });
  });

  getPredictionsByMonthV2 = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const month: any = req.query.month; // optional

    const user = await User.findById(userId);

    const journey = await PersonalizeJourney.findById(
      user?.personalize_Journey_Id
    );
    if (!journey) return res.status(404).json({ error: 'Journey not found' });

    const { periodStartDate, periodLength, avgMenstrualCycleLength } = journey;
    const today = new Date();
    const startMonth = month ? new Date(`${month}-01`) : today;

    const predictions = [];

    for (let i = 0; i < 12; i++) {
      //------------------------------------
      if (!month) {
        return res.status(400).json({ error: 'Month is required' });
      }

      const [year, mon] = month.split('-').map(Number);

      const startDate = new Date(year, mon - 1, 1);
      const endDate = new Date(year, mon, 1); // first day of next month

      const insights = await DailyCycleInsights.find({
        userId,
        date: { $gte: startDate, $lt: endDate },
      }).lean();

      const formattedData: any = {};

      insights.forEach(entry => {
        const dateKey = entry.date
          .toISOString()
          .slice(0, 10)
          .split('-')
          .reverse()
          .join('-'); // DD-MM-YYYY

        // Pick only non-null/undefined fields you care to show
        const { menstrualFlow, phase } = entry;

        formattedData[dateKey] = {};

        if (menstrualFlow) formattedData[dateKey].menstrualFlow = menstrualFlow;
        if (phase) formattedData[dateKey].phase = phase;
      });

      // ----------------------------------

      const predictedStart = new Date(periodStartDate);
      predictedStart.setDate(
        predictedStart.getDate() + i * Number(avgMenstrualCycleLength)
      );

      const predictedEnd = new Date(predictedStart);
      predictedEnd.setDate(predictedEnd.getDate() + Number(periodLength) - 1);

      const ovulation = new Date(predictedStart);
      ovulation.setDate(
        ovulation.getDate() + Math.floor(Number(avgMenstrualCycleLength) / 2)
      );

      const fertileStart = new Date(ovulation);
      fertileStart.setDate(fertileStart.getDate() - 3);

      const fertileEnd = new Date(ovulation);
      fertileEnd.setDate(fertileEnd.getDate() + 1);

      predictions.push({
        month: predictedStart.toISOString().slice(0, 7),
        predictedPeriodStart: predictedStart,
        predictedPeriodEnd: predictedEnd,
        predictedOvulationDate: ovulation,
        fertileWindow: [fertileStart, fertileEnd],
        formattedData,
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      code: StatusCodes.OK,
      data: predictions,
      message: 'Fertie Ok successfully',
    });
  });


*/