import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { GenericController } from '../../__Generic/generic.controller';
import { ISubscription } from './subscription.interface';
import { Subscription } from './subscription.model';
import { SubscriptionService } from './subscription.service';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import ApiError from '../../../errors/ApiError';
import { SubscriptionType } from './subscription.constant';

const subscriptionService = new SubscriptionService();

export class SubscriptionController extends GenericController<
  typeof Subscription,
  ISubscription
> {
  private stripe: Stripe;

  constructor() {
    super(new SubscriptionService(), 'Subscription');
    // Initialize Stripe with secret key (from your Stripe Dashboard)
    this.stripe = new Stripe('your_stripe_secret_key');
  }

  subscribe = catchAsync(async (req: Request, res: Response) => {
    // get product price by the plan parameter
    // plan parameter comes from req.query
    const { plan } = req.query;
    const { userId } = req.user;

    if (!plan) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `plan is not provided in query, it should be ${Object.values(
          SubscriptionType
        ).join(', ')}`
      );
    }

    if (!userId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `User must be logged in to subscribe`
      );
    }

    // check if plan is valid
    const validPLan = await subscriptionService.getBySubscriptionType(
      plan as string
    );

    if (!validPLan) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Invalid plan provided in query, it should be ${Object.values(
          SubscriptionType
        ).join(', ')}`
      );
    }

    let priceId;

    switch (plan.toString().toLowerCase()) {
      case SubscriptionType.standard:
        // standard plan price id inside a variable `
        priceId = process.env.STRIPE_STANDARD_PLAN_PRICE_ID; // 🔥 add korte hobe process.env file e ..
        break;
      case SubscriptionType.premium:
        priceId = process.env.STRIPE_PREMIUM_PLAN_PRICE_ID; // 🔥 add korte hobe process.env file e .
        break;
      case SubscriptionType.vip:
        priceId = process.env.STRIPE_VIP_PLAN_PRICE_ID; // 🔥 add korte hobe process.env file e .
        break;
      default:
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Invalid plan provided in query, it should be ${Object.values(
            SubscriptionType
          ).join(', ')}`
        );
    }

    /// productId and priceId duita e lagbe .. stripe er ..
    /// check out session er shomoy ..

    // if we have own database with plans table .. make sure
    // make sure we have both stripe productId and priceId ..

    // when a customer subscribe a plan  .. we need to create stripe
    // check out session ..

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription', // You can change it to 'payment' if it's a one-time payment
      payment_method_types: ['card'],
      line_items: [
        {
          /*
            price_data: {
              currency: "usd", // or your preferred currency
              product_data: {
                name: plan.name,
                description: plan.description,
              },
              unit_amount: plan.price * 100, // Amount in cents
            },
            quantity: 1,
          */
          price: priceId, // Use the price ID from your Stripe Dashboard
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      metadata: {
        userId: userId, // Store userId or other data in metadata for future reference
      },
    });

    console.log('session 🔥🔥', session);

    if (!session.url) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Unable to create subscription session`
      );
    }

    const data = req.body;
    // const result = await this.service.create(data);

    // res.redirect(session?.url ?? session?.url);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: session.url,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });

  customerPortal = catchAsync(async (req: Request, res: Response) => {
    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: req.params.customerId, // The ID of the customer you want to create a portal session for
      return_url: `${process.env.CLIENT_URL}/account`, // URL to redirect the customer after they leave the portal
    });

    sendResponse(res, {
      code: StatusCodes.OK,
      data: portalSession.url,
      message: `Customer portal session created successfully`,
      success: true,
    });
  });

  webhook = catchAsync(async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Your webhook secret from Stripe Dashboard

    let event;

    event = this.stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    if (!event) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Stripe Webhook Error: ${event}`
      );
    }

    // catch (err) {
    //   console.log('Error constructing webhook event:', err);
    //   return res.status(400).send(`Webhook Error: ${err.message}`);
    // }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful subscription creation here
        console.log('Subscription created successfully:', event.data.object);
        break;
      case 'invoice.paid':
        // Handle successful invoice payment here
        // Event when payment is successful (every subscription interval )
        console.log('Invoice paid:', event.data);
        break;
      case 'invoice.payment_failed':
        // Event when the payment failed  due to card problem  or insufficient funds (every subscription interval )
        console.log('Invoice payment failed:', event.data);
        break;
      case 'customer.subscription.trial_will_end':
        // Event when the trial period is about to end
        console.log('Trial period will end:', event.data.object);
        break;
      case 'customer.subscription.updated':
        // Handle subscription update here
        console.log('Subscription updated:', event.data);
        break;
      case 'customer.subscription.deleted':
        // Handle subscription cancellation here
        console.log('Subscription canceled:', event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: { received: true },
      message: `Customer portal session created successfully`,
      success: true,
    });
  });

  // add more methods here if needed or override the existing ones
}

/*
  subscribe = catchAsync(async (req: Request, res: Response) => {
    // get product price by the plan parameter
    // plan parameter comes from req.query
    const { plan } = req.query;
    const { userId } = req.user;

    if (!plan) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `plan must be provided by query params it can be ${Object.values(
          SubscriptionType
        ).join(', ')}`
      );
    }

    if (!userId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'user must be logged in');
    }

    // check if plan is valid
    const validPlan = await subscriptionService.getBySubscriptionType(
      plan as string
    );

    if (!validPlan) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'The plan you requested is not valid.'
      );
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription', // You can change it to 'payment' if it's a one-time payment
      payment_method_types: ['card'],
      line_items: [
        {
          // price id pass korte hobe ..
          price_data: {
            currency: 'usd', // or your preferred currency
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.price * 100, // Amount in cents
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        userId: userId, // Store userId or other data in metadata for future reference
      },
    });

    /// productId and priceId duita e lagbe .. stripe er ..
    /// check out session er shomoy ..

    // if we have own database with plans table .. make sure
    // make sure we have both stripe productId and priceId ..

    // when a customer subscribe a plan  .. we need to create stripe
    // check out session ..

    const data = req.body;
    const result = await this.service.create(data);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });
}

*/
