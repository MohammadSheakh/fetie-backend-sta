import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../__Generic/generic.controller';
import catchAsync from '../../shared/catchAsync';
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

    // console.log(`daysLeftForNextPeriodStart: ${daysLeftForNextPeriodStart}`);
    // console.log(
    //   `daysLeftForNextOvulationDate: ${daysLeftForNextOvulationDate}`
    // );

    // phase , fertility , cycle day 🔥 egula niye chinta korte hobe ...

   
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
  getPredictionsByMonth = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const monthQuery: any = req.query.month; // mandatory

    const user = await User.findById(userId);

    const journey = await PersonalizeJourney.findById(
      user?.personalize_Journey_Id
    );
    if (!journey) return res.status(404).json({ error: 'Journey not found' });

    const { periodStartDate, periodLength, avgMenstrualCycleLength } = journey;
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

        if (menstrualFlow) formattedData[dateKey].menstrualFlow = menstrualFlow;
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
  });

  //>  We This Function May Have Issue .. must have to test it properly
  //> cycle day calculattion has issue ..
  getPredictionsByMonthV2 = catchAsync(
    async (req: Request, res: Response): Promise<any> => {
      const userId = req.user.userId;
      const monthQuery: any = req.query.month; // mandatory

      let currentMonthData: any = null;

      const user = await User.findById(userId);

      const journey = await PersonalizeJourney.findById(
        user?.personalize_Journey_Id
      );

      
      if (!journey) return res.status(404).json({ error: 'Journey not found' });

      const { periodStartDate, periodLength, avgMenstrualCycleLength } =
        journey;
      const today = new Date();

      // This will be our reference date to calculate future periods
      const baseDate = new Date(periodStartDate);

      // The month we want to start showing predictions from
      const startMonth = monthQuery ? new Date(`${monthQuery}-01`) : today;
      const startYear = startMonth.getFullYear();
      const startMonthNum = startMonth.getMonth();

      // Create a map to store predictions by month
      const predictionsByMonth: {
        [key: string]: { month: string; events: any[]; dailyLogs: any };
      } = {};

      // Calculate predictions for enough cycles to cover 12 months from the start month
      // We'll generate more than 12 months of predictions to ensure we have data for all requested months
      const cyclesToGenerate = 12; // Generate enough cycles to ensure coverage

      let cycleDay;

      for (let i = 0; i < cyclesToGenerate; i++) {
        // Calculate this cycle's predicted start date
        const predictedStart = new Date(baseDate);
        predictedStart.setDate(
          predictedStart.getDate() + i * Number(avgMenstrualCycleLength)
        );

        // Skip if this prediction is before our start month
        const predictionYear = predictedStart.getFullYear();
        const predictionMonth = predictedStart.getMonth();
        if (
          predictionYear < startYear ||
          (predictionYear === startYear && predictionMonth < startMonthNum)
        ) {
          continue;
        }

        // Create month key for this prediction
        const monthKey = `${predictionYear}-${String(
          predictionMonth + 1
        ).padStart(2, '0')}`;

        // Skip if we already have 12 months of predictions
        if (
          Object.keys(predictionsByMonth).length >= 12 &&
          !predictionsByMonth[monthKey]
        ) {
          continue;
        }

        // Calculate other prediction dates
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

        // Modified portion of getPredictionsByMonthV2 function
        // Add this after calculating the fertile window

        // Calculate implantation window (6-12 days after ovulation)
        const implantationStart = new Date(ovulation);
        implantationStart.setDate(implantationStart.getDate() + 6);

        const implantationEnd = new Date(ovulation);
        implantationEnd.setDate(implantationEnd.getDate() + 12);

        // Initialize this month's prediction if it doesn't exist
        if (!predictionsByMonth[monthKey]) {
          predictionsByMonth[monthKey] = {
            month: monthKey,
            events: [],
            dailyLogs: {},
          };
        }

        // Inside your loop that builds predictionsByMonth
        const currentDate = new Date(); // Replace with the actual current date
        const isCurrentMonth =
          predictionYear === currentDate.getFullYear() &&
          predictionMonth === currentDate.getMonth();

        if (isCurrentMonth) {
          // Add this cycle's prediction to the appropriate month
          currentMonthData = {
            predictedPeriodStart: predictedStart,
            predictedPeriodEnd: predictedEnd,
            predictedOvulationDate: ovulation,
            fertileWindow: [fertileStart, fertileEnd],
            implantationWindow: [implantationStart, implantationEnd], // Added this line
            currentMonth: true, // Add this line
          };

          predictionsByMonth[monthKey].events.push({
            predictedPeriodStart: predictedStart,
            predictedPeriodEnd: predictedEnd,
            predictedOvulationDate: ovulation,
            fertileWindow: [fertileStart, fertileEnd],
            implantationWindow: [implantationStart, implantationEnd], // Added this line
          });

          cycleDay = differenceInDays(currentDate, predictedStart) + 1;
          // console.log('cycle day 🔥', cycleDay);
        } else {
          // // Add this cycle's prediction to the appropriate month
          predictionsByMonth[monthKey].events.push({
            predictedPeriodStart: predictedStart,
            predictedPeriodEnd: predictedEnd,
            predictedOvulationDate: ovulation,
            fertileWindow: [fertileStart, fertileEnd],
            implantationWindow: [implantationStart, implantationEnd], // Added this line
          });
        }

        // // Add this cycle's prediction to the appropriate month
        // predictionsByMonth[monthKey].events.push({
        //   predictedPeriodStart: predictedStart,
        //   predictedPeriodEnd: predictedEnd,
        //   predictedOvulationDate: ovulation,
        //   fertileWindow: [fertileStart, fertileEnd],
        //   implantationWindow: [implantationStart, implantationEnd] // Added this line
        // });
      }

      // 🟢🟢🟢🟢

      // now we got the cycle day .. we have to generate response from chatgpt based on cycle day
      
      const gptResponseForCycleDay =
        await this.fertieService.getChatBotsFeedbackAboutCurrentDailyCycle(
          cycleDay ? cycleDay : 0
        ); // FIX ME : ekhane 0 send kora jabe na ..

      currentMonthData.gptResponse = gptResponseForCycleDay;
      currentMonthData.cycleDay = cycleDay; // Add cycle day to current month data

      // Now fetch daily insights for each month we have predictions for
      for (const monthKey of Object.keys(predictionsByMonth)) {
        const [year, month] = monthKey.split('-').map(Number);

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month
      /*
      ///////////// 🟢🟢🟢🟢🟢🟢 
      // Fetch DailyCycleInsights for this month
      const insights = await DailyCycleInsights.find({
        userId,
        date: { $gte: startDate, $lte: endDate },
      }).lean();
      
      const formattedData = {};
      
      insights.forEach(entry => {
        const dateKey = entry.date
          .toISOString()
          .slice(0, 10)
          .split('-')
          .reverse()
          .join('-'); // DD-MM-YYYY
        
        const { menstrualFlow, phase } = entry;
        
        formattedData[dateKey] = {};
        
        if (menstrualFlow)
          formattedData[dateKey].menstrualFlow = menstrualFlow;
        if (phase) 
          formattedData[dateKey].phase = phase;
      });
      
      predictionsByMonth[monthKey].dailyLogs = formattedData;

      */
      }

      // Convert the predictions map to an array sorted by month
      const predictions = Object.values(predictionsByMonth)
        .sort((a: any, b: any) => a.month.localeCompare(b.month))
        .slice(0, 12); // Ensure we only return 12 months

      res.status(StatusCodes.OK).json({
        success: true,
        code: StatusCodes.OK,
        data: { predictions, currentMonthData },
        message: 'Predictions fetched successfully',
      });
    }
  );

  getPredictionsByMonth_Claude_V3 = catchAsync(
    async (req: Request, res: Response): Promise<any> => {
      const userId = req.user.userId;
      const monthQuery: any = req.query.month; // mandatory
      let currentMonthData: any = null;
      let cycleDay: number = 0;

      const user = await User.findById(userId);
      const journey = await PersonalizeJourney.findById(
        user?.personalize_Journey_Id
      );

      if (!journey) return res.status(404).json({ error: 'Journey not found' });

      const { periodStartDate, periodLength, avgMenstrualCycleLength } =
        journey;
      const today = new Date();
      const baseDate = new Date(periodStartDate);

      // Calculate current cycle day first (before predictions)
      cycleDay = calculateCurrentCycleDay(
        today,
        baseDate,
        Number(avgMenstrualCycleLength)
      );
      
      // The month we want to start showing predictions from
      const startMonth = monthQuery ? new Date(`${monthQuery}-01`) : today;
      const startYear = startMonth.getFullYear();
      const startMonthNum = startMonth.getMonth();

      // Create a map to store predictions by month
      const predictionsByMonth: {
        [key: string]: { month: string; events: any[]; dailyLogs: any };
      } = {};

      // Calculate predictions for enough cycles to cover 12 months from the start month
      const cyclesToGenerate = 15; // Generate extra cycles to ensure coverage
      let currentMonthFound = false;

      for (let i = 0; i < cyclesToGenerate; i++) {
        // Calculate this cycle's predicted start date
        const predictedStart = new Date(baseDate);
        predictedStart.setDate(
          predictedStart.getDate() + i * Number(avgMenstrualCycleLength)
        );

        // Skip if this prediction is before our start month
        const predictionYear = predictedStart.getFullYear();
        const predictionMonth = predictedStart.getMonth();

        if (
          predictionYear < startYear ||
          (predictionYear === startYear && predictionMonth < startMonthNum)
        ) {
          continue;
        }

        // Create month key for this prediction
        const monthKey = `${predictionYear}-${String(
          predictionMonth + 1
        ).padStart(2, '0')}`;

        // Skip if we already have 12 months of predictions
        if (
          Object.keys(predictionsByMonth).length >= 12 &&
          !predictionsByMonth[monthKey]
        ) {
          break;
        }

        // Calculate other prediction dates
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

        // Calculate implantation window (6-12 days after ovulation)
        const implantationStart = new Date(ovulation);
        implantationStart.setDate(implantationStart.getDate() + 6);

        const implantationEnd = new Date(ovulation);
        implantationEnd.setDate(implantationEnd.getDate() + 12);

        // Initialize this month's prediction if it doesn't exist
        if (!predictionsByMonth[monthKey]) {
          predictionsByMonth[monthKey] = {
            month: monthKey,
            events: [],
            dailyLogs: {},
          };
        }

        // Check if this cycle contains the current date (improved logic)
        const currentDate = new Date();
        const nextCycleStart = new Date(predictedStart);
        nextCycleStart.setDate(
          nextCycleStart.getDate() + Number(avgMenstrualCycleLength)
        );

        const isCurrentCycle =
          currentDate >= predictedStart && currentDate < nextCycleStart;
        const isCurrentMonth =
          predictionYear === currentDate.getFullYear() &&
          predictionMonth === currentDate.getMonth();

        // Create prediction event
        const predictionEvent = {
          predictedPeriodStart: predictedStart,
          predictedPeriodEnd: predictedEnd,
          predictedOvulationDate: ovulation,
          fertileWindow: [fertileStart, fertileEnd],
          implantationWindow: [implantationStart, implantationEnd],
        };

        // Add event to predictions
        predictionsByMonth[monthKey].events.push(predictionEvent);

        // Set current month data if this is the current cycle or current month
        if ((isCurrentCycle || isCurrentMonth) && !currentMonthFound) {
          currentMonthData = {
            ...predictionEvent,
            currentMonth: true,
            cycleDay: cycleDay,
          };
          currentMonthFound = true;
        }
      }

      if (cycleDay <= 0 || cycleDay > Number(avgMenstrualCycleLength)) {
        console.warn(`Invalid cycle day: ${cycleDay}, using day 1 as fallback`);
        cycleDay = 1;
      }

      const gptResponseForCycleDay =
        await this.fertieService.getChatBotsFeedbackAboutCurrentDailyCycle(
          cycleDay
        );

      if (currentMonthData) {
        currentMonthData.gptResponse = gptResponseForCycleDay;
        currentMonthData.cycleDay = cycleDay;
      } else {
        // Fallback: create current month data if not found
        const currentDate = new Date();
        const currentMonthKey = `${currentDate.getFullYear()}-${String(
          currentDate.getMonth() + 1
        ).padStart(2, '0')}`;

        currentMonthData = {
          currentMonth: true,
          cycleDay: cycleDay,
          gptResponse: gptResponseForCycleDay,
          note: 'Current cycle data estimated',
        };
      }

      // Fetch daily insights for each month (your existing logic)
      for (const monthKey of Object.keys(predictionsByMonth)) {
        const [year, month] = monthKey.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month

        // Your existing insights fetching logic would go here
        // Currently commented out in your original code
      }

      // Convert the predictions map to an array sorted by month
      const predictions = Object.values(predictionsByMonth)
        .sort((a: any, b: any) => a.month.localeCompare(b.month))
        .slice(0, 12); // Ensure we only return 12 months

      res.status(StatusCodes.OK).json({
        success: true,
        code: StatusCodes.OK,
        data: { predictions, currentMonthData },
        message: 'Predictions fetched successfully',
      });
    }
  );

  getPredictionsByMonth_QWEN_V4 = catchAsync(
    async (req: Request, res: Response): Promise<any> => {
      const userId = req.user.userId;
      const monthQuery: any = req.query.month; // e.g., "2025-04"

      let currentMonthData: any = null;
      let cycleDay: number | null = null;

      const user = await User.findById(userId);
      if (!user || !user.personalize_Journey_Id) {
        return res.status(404).json({ error: 'User or Journey ID not found' });
      }

      const journey = await PersonalizeJourney.findById(
        user.personalize_Journey_Id
      );

      if (!journey) {
        return res.status(404).json({ error: 'Journey not found' });
      }

      const { periodStartDate, periodLength, avgMenstrualCycleLength } =
        journey;

      if (!periodStartDate || !avgMenstrualCycleLength || !periodLength) {
        return res.status(400).json({ error: 'Incomplete journey data' });
      }

      const today = new Date();
      const baseDate = new Date(periodStartDate);
      const startMonth = monthQuery
        ? new Date(`${monthQuery}-01`)
        : new Date(today.getFullYear(), today.getMonth(), 1);

      const startYear = startMonth.getFullYear();
      const startMonthNum = startMonth.getMonth();

      const predictionsByMonth: {
        [key: string]: { month: string; events: any[]; dailyLogs: any };
      } = {};

      let i = 0;

      while (Object.keys(predictionsByMonth).length < 12) {
        const predictedStart = new Date(baseDate);
        predictedStart.setDate(
          predictedStart.getDate() + i * Number(avgMenstrualCycleLength)
        );

        const predictionYear = predictedStart.getFullYear();
        const predictionMonth = predictedStart.getMonth();

        if (
          predictionYear < startYear ||
          (predictionYear === startYear && predictionMonth < startMonthNum)
        ) {
          i++;
          continue;
        }

        const monthKey = `${predictionYear}-${String(
          predictionMonth + 1
        ).padStart(2, '0')}`;

        if (!predictionsByMonth[monthKey]) {
          predictionsByMonth[monthKey] = {
            month: monthKey,
            events: [],
            dailyLogs: {},
          };
        }

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

        const implantationStart = new Date(ovulation);
        implantationStart.setDate(implantationStart.getDate() + 6);

        const implantationEnd = new Date(ovulation);
        implantationEnd.setDate(implantationEnd.getDate() + 12);

        const isCurrentMonth =
          predictionYear === today.getFullYear() &&
          predictionMonth === today.getMonth();

        if (isCurrentMonth) {
          cycleDay = differenceInDays(today, predictedStart) + 1;
          
          currentMonthData = {
            predictedPeriodStart: formatDate(predictedStart),
            predictedPeriodEnd: formatDate(predictedEnd),
            predictedOvulationDate: formatDate(ovulation),
            fertileWindow: [formatDate(fertileStart), formatDate(fertileEnd)],
            implantationWindow: [
              formatDate(implantationStart),
              formatDate(implantationEnd),
            ],
            currentMonth: true,
            cycleDay,
          };

          predictionsByMonth[monthKey].events.push(currentMonthData);
        } else {
          predictionsByMonth[monthKey].events.push({
            predictedPeriodStart: formatDate(predictedStart),
            predictedPeriodEnd: formatDate(predictedEnd),
            predictedOvulationDate: formatDate(ovulation),
            fertileWindow: [formatDate(fertileStart), formatDate(fertileEnd)],
            implantationWindow: [
              formatDate(implantationStart),
              formatDate(implantationEnd),
            ],
          });
        }
        i++;
      }

      // Get GPT response based on cycle day
      try {
        if (currentMonthData && cycleDay !== null) {
          const gptResponseForCycleDay =
            await this.fertieService.getChatBotsFeedbackAboutCurrentDailyCycle(
              cycleDay
            );
          currentMonthData.gptResponse = gptResponseForCycleDay;
        } else {
          currentMonthData = {
            currentMonth: false,
            cycleDay: null,
            gptResponse: null,
          };
        }
      } catch (error) {
        console.error('GPT Service Error:', error);
        currentMonthData = {
          ...currentMonthData,
          gptResponse: 'Unable to fetch AI insights at this time.',
        };
      }

      // Fetch daily logs for each month
      for (const monthKey of Object.keys(predictionsByMonth)) {
        const [year, month] = monthKey.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of the month

        const insights = await DailyCycleInsights.find({
          userId,
          date: { $gte: startDate, $lte: endDate },
        }).lean();

        const formattedData: Record<string, any> = {};
        insights.forEach(entry => {
          const dateKey = formatDailyLogKey(entry.date);
          formattedData[dateKey] = {};
          if (entry.menstrualFlow)
            formattedData[dateKey].menstrualFlow = entry.menstrualFlow;
          if (entry.phase) formattedData[dateKey].phase = entry.phase;
        });

        predictionsByMonth[monthKey].dailyLogs = formattedData;
      }

      // Convert map to sorted array
      const predictions = Object.values(predictionsByMonth)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(0, 12);

      res.status(StatusCodes.OK).json({
        success: true,
        code: StatusCodes.OK,
        data: { predictions, currentMonthData },
        message: 'Predictions fetched successfully',
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
      })
        .lean()
        .populate('labTestLogId');

      const formattedData: any = {};

      insights.forEach(entry => {
        const dateKey = entry.date
          .toISOString()
          .slice(0, 10)
          .split('-')
          .reverse()
          .join('-'); // DD-MM-YYYY

        // Pick only non-null/undefined fields you care to show
        const {
          menstrualFlow,
          mood,
          activity,
          symptoms,
          phase,
          fertilityLevel,
          cycleDay,
          cervicalMucus,
          date,
          labTestLogId,
        } = entry;

        formattedData[dateKey] = {};

        if (menstrualFlow) formattedData[dateKey].menstrualFlow = menstrualFlow;
        if (phase) formattedData[dateKey].phase = phase;

        if (mood) formattedData[dateKey].mood = mood;
        if (activity) formattedData[dateKey].activity = activity;
        if (symptoms) formattedData[dateKey].symptoms = symptoms;
        if (fertilityLevel)
          formattedData[dateKey].fertilityLevel = fertilityLevel;
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

      // Set start of the day (00:00:00.000)
      const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));

      // Set end of the day (23:59:59.999)
      const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));

      const insights = await DailyCycleInsights.find({
        userId,
        date: { $gte: startOfDay, $lt: endOfDay },
      })
        .lean()
        .populate('labTestLogId');

      const formattedData: any = {};

      insights.forEach(entry => {
        const dateKey = entry.date
          .toISOString()
          .slice(0, 10)
          .split('-')
          .reverse()
          .join('-'); // DD-MM-YYYY

        // Pick only non-null/undefined fields you care to show
        const {
          menstrualFlow,
          mood,
          activity,
          symptoms,
          phase,
          fertilityLevel,
          cycleDay,
          cervicalMucus,
          date
        } = entry;

        formattedData[dateKey] = {};

        if (menstrualFlow) formattedData[dateKey].menstrualFlow = menstrualFlow;
        if (phase) formattedData[dateKey].phase = phase;

        if (mood) formattedData[dateKey].mood = mood;
        if (activity) formattedData[dateKey].activity = activity;
        if (symptoms) formattedData[dateKey].symptoms = symptoms;
        if (fertilityLevel)
          formattedData[dateKey].fertilityLevel = fertilityLevel;
        if (cycleDay) formattedData[dateKey].cycleDay = cycleDay;
        if (cervicalMucus) formattedData[dateKey].cervicalMucus = cervicalMucus;
        if (date) formattedData[dateKey].date = date;
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

// Helper function to calculate current cycle day
function calculateCurrentCycleDay(
  currentDate: Date,
  baseDate: Date,
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

// Additional helper function for better date handling
function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

// Helper function to find the current cycle
function findCurrentCycle(
  currentDate: Date,
  baseDate: Date,
  avgCycleLength: number
): { cycleStart: Date; cycleEnd: Date; cycleNumber: number } {
  const daysSinceBase = Math.floor(
    (currentDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const cycleNumber = Math.floor(daysSinceBase / avgCycleLength);

  const cycleStart = new Date(baseDate);
  cycleStart.setDate(cycleStart.getDate() + cycleNumber * avgCycleLength);

  const cycleEnd = new Date(cycleStart);
  cycleEnd.setDate(cycleEnd.getDate() + avgCycleLength - 1);

  return { cycleStart, cycleEnd, cycleNumber };
}

// Helper to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper to format date key as DD-MM-YYYY
function formatDailyLogKey(date: Date): string {
  const [year, month, day] = date.toISOString().split('T')[0].split('-');
  return `${day}-${month}-${year}`;
}
