import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../__Generic/generic.controller';
import catchAsync from '../../shared/catchAsync';
import ApiError from '../../errors/ApiError';
import { DailyCycleInsights } from './dailyCycleInsights.model';
import { IDailyCycleInsights } from './dailyCycleInsights.interface';
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

  createByDate = catchAsync(
    async (req: Request, res: Response) => {
      const { date } = req.params;
      const userId = req.user.userId;
      
      // const result = await this.dailyCycleInsightsService.
  })


  // add more methods here if needed or override the existing ones
}

