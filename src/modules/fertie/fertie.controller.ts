import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../__Generic/generic.controller';
import catchAsync from '../../shared/catchAsync';
import ApiError from '../../errors/ApiError';
import { FertieService } from './fertie.service';
import { Fertie } from './fertie.model';
import { IFertie } from './fertie.interface';


//const fertieService = new FertieService();

export class DailyCycleInsightsController extends GenericController<
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
  
  // add more methods here if needed or override the existing ones
}

