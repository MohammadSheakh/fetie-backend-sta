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

const dailyCycleInsightsService = new DailyCycleInsightsService();

export class DailyCycleInsightsController extends GenericController<
  typeof DailyCycleInsights,
  IDailyCycleInsights
> {
  // private stripe: Stripe;
  dailyCycleInsightsService = new DailyCycleInsightsService();

  constructor() {
    super(new DailyCycleInsightsService(), 'Daily Cycle Insights');
    // Initialize Stripe with secret key (from your Stripe Dashboard)
    // this.stripe = new Stripe('your_stripe_secret_key');
  }

  //[🚧][🧑‍💻✅][🧪] // 🆗
  create = catchAsync(async (req: Request, res: Response) => {
    const {
      activity,
      cervicalMucus,
      cycleDay,
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

    const dailyCycleInsightFound =
      await this.dailyCycleInsightsService.getByDateAndUserId(
        req.body.date,
        userId
      );
    if (dailyCycleInsightFound) {
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
      res.status(StatusCodes.CREATED).json({
        success: true,
        code: StatusCodes.OK,
        data: result,
        message: 'Daily Cycle Insights updated successfully',
      });
    } else {
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

        labTestLog = await LabTestLog.create({
          userId: userId,
          [labTestName]: labTestValue,
        });
        req.body.labTestLogId = labTestLog._id;
      }

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

  getByDateAndUserId = catchAsync(async (req: Request, res: Response) => {
    const { date } = req.body;
    const userId = req.user.userId;

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
    res.status(StatusCodes.OK).json({
      success: true,
      code: StatusCodes.OK,
      data: result,
      message: 'Daily Cycle Insights fetched successfully',
    });
  });

  // add more methods here if needed or override the existing ones
}
