import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../__Generic/generic.controller';
import catchAsync from '../../shared/catchAsync';
import ApiError from '../../errors/ApiError';
import { DailyCycleInsights } from './dailyCycleInsights.model';
import { IDailyCycleInsights, TDailyCycleInsights } from './dailyCycleInsights.interface';
import { DailyCycleInsightsService } from './dailyCycleInsights.service';

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
  create = catchAsync(
    async (req: Request, res: Response) => {
      const { activity,cervicalMucus,cycleDay, date, fertilityLevel, menstrualFlow, mood, phase, symptoms } : TDailyCycleInsights = req.body;
      const userId = req.user.userId;
      console.log('🚧 DailyCycleInsightsController -> create -> userId', userId);
      req.body.userId = userId;

      const dailyCycleInsightFound = await this.dailyCycleInsightsService.getByDateAndUserId(req.body.date, userId)
      if(dailyCycleInsightFound){
        const result = await this.dailyCycleInsightsService.updateByDateAndUserId(req.body);
        res.status(StatusCodes.CREATED).json({
          success: true,
          code : StatusCodes.OK,
          data: result,
          message: 'Daily Cycle Insights updated successfully',
        });
      }else{
        const result = await this.dailyCycleInsightsService.createByDateAndUserId(req.body);

        if (!result) {
          throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Daily Cycle Insights');
        }
        res.status(StatusCodes.CREATED).json({
          success: true,
          code : StatusCodes.CREATED,
          data: result,
          message: 'Daily Cycle Insights created successfully',
        });  
      }

      
      
  })

  updateByDate = catchAsync (
    async (req : Request, res : Response) => {
      const { date } = req.body;
      const userId = req.user.userId;
      console.log('🚧 DailyCycleInsightsController -> updateByDate -> userId', userId);
      req.body.userId = userId;

      const result = await this.dailyCycleInsightsService.updateByDateAndUserId(req.body);

      if (!result) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update Daily Cycle Insights');
      }
      res.status(StatusCodes.OK).json({
        success: true,
        code : StatusCodes.OK,
        data: result,
        message: 'Daily Cycle Insights updated successfully',
      });
    }
  )

  // add more methods here if needed or override the existing ones
}

