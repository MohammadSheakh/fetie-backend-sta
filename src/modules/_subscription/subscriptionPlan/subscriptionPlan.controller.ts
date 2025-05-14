import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { GenericController } from '../../__Generic/generic.controller';
import { IConfirmPayment, ISubscriptionPlan } from './subscriptionPlan.interface';
import { SubscriptionPlanService } from './subscriptionPlan.service';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import ApiError from '../../../errors/ApiError';
import { CurrencyType, InitialDurationType, RenewalFrequncyType, SubscriptionType } from './subscriptionPlan.constant';
import { User } from '../../user/user.model';
import { UserCustomService } from '../../user/user.service';
import mongoose from 'mongoose';
import { PaymentTransactionService } from '../../_payment/paymentTransaction/paymentTransaction.service';
import { SubscriptionPlan } from './subscriptionPlan.model';

const subscriptionPlanService = new SubscriptionPlanService();
const userCustomService = new UserCustomService();

const paymentTransactionService = new PaymentTransactionService();

export class SubscriptionController extends GenericController<
  typeof SubscriptionPlan,
  ISubscriptionPlan
> {
  private stripe: Stripe;

  constructor() {
    super(new SubscriptionPlanService(), 'Subscription Plan');
    // Initialize Stripe with secret key (from your Stripe Dashboard) // https://dashboard.stripe.com/test/dashboard
    this.stripe = new Stripe(
      process.env.STRIPE_SECRET_KEY as string,
      {
        apiVersion: '2025-02-24.acacia',
        typescript: true,
      }
  );
  }

  subscribeFromBackEnd = catchAsync(async (req: Request, res: Response) => {
    // get product price by the plan parameter
    // plan parameter comes from req.query
    const { subscriptionPlanId } = req.query;
    const { userId } = req.user;

    console.log('userId 🔥🔥', userId);
    console.log('subscriptionPlanId 🔥🔥', subscriptionPlanId);

    
    if (!userId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `User must be logged in to subscribe`
      );
    }

    if (!subscriptionPlanId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        // `plan is not provided in query, it should be ${Object.values(
        //   SubscriptionType
        // ).join(', ')}`
        'subscriptionPlanId is not provided in req.query'
      );
    }

    // Validate if subscriptionPlanId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(subscriptionPlanId)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Invalid subscriptionPlanId provided`
    );
  }

    
    // get the subscription plan by id
    const subscriptionPlan = await subscriptionPlanService.getById(
      subscriptionPlanId // as string
    );
    if (!subscriptionPlan) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Subscription plan not found`
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `User not found`
      );
    }

    // create or retrieve stripe customer id 

    let stripeCustomerId = user.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: userId.toString(), // ekhane user._id chilo 🟢🟢
        },
      });

      stripeCustomerId = customer.id;
      user.stripe_customer_id = stripeCustomerId;
      await user.save();

       // Update user with Stripe customer ID
       //await userService.update(userId, { stripe_customer_id: stripeCustomerId });
    }

    // we can call this session  paymentGatewayData
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment', // You can change it to 'payment' if it's a one-time payment  // 'subscription'
      payment_method_types: ['card'], // , 'paypal'
      customer: stripeCustomerId,
      line_items: [
        {
          price: subscriptionPlan.stripe_price_id, // Use the price ID from your Stripe Dashboard
          quantity: 1,
        },
      ],
      // process.env.CLIENT_URL
      // process.env.BACKEND_IP
      success_url:`${'http://127.0.0.1:3000'}/api/v1/subscription/confirm-payment?session_id={CHECKOUT_SESSION_ID}&userId=${userId}&amount=${subscriptionPlan.amount}&subscriptionId=${subscriptionPlan._id}&duration=${subscriptionPlan.initialDuration}`,
      /*
      success_url: "${'http://127.0.0.1:3000'}/api/v1/subscription/confirm-payment"+
      "?session_id={CHECKOUT_SESSION_ID}"+
      "&userId=${userId}&amount=${subscriptionPlan.amount}"+
      "&subscriptionId=${subscriptionPlan._id}"+
      "&duration=${subscriptionPlan.initialDuration}",
      */
      cancel_url: `${'http://127.0.0.1:3000'}/api/v1/subscription/cancel?paymentId=${"paymentDummy"}`,
      invoice_creation: {
        enabled: true,
      },
      metadata: {
        userId: userId, // Store userId or other data in metadata for future reference
        subscriptionPlanId : subscriptionPlanId as string,
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
      data: session.url, //session.url,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });

  /*


  line_items: [
        {
          
          //  price_data: {
          //    currency: "usd", // or your preferred currency
          //    product_data: {
          //      name: subscriptionPlan.name,
          //      description: "please, fill up your information",
          //      images: payload?.images, // optional
          //    },
          //    unit_amount: subscriptionPlan.price * 100, // Amount in cents
          //  },
          //  quantity: 1,
          
          price: subscriptionPlan.stripe_price_id, // Use the price ID from your Stripe Dashboard
          quantity: 1,
        },
      ],

  
    // check if plan is valid
    // const validPLan = await subscriptionPlanService.getBySubscriptionType(
    //   plan as string
    // );

    // if (!validPLan) {
    //   throw new ApiError(
    //     StatusCodes.BAD_REQUEST,
    //     `Invalid plan provided in query, it should be ${Object.values(
    //       SubscriptionType
    //     ).join(', ')}`
    //   );
    // }

    
      switch (plan.toString().toLowerCase()) {
        case SubscriptionType.premium:
          priceId = process.env.STRIPE_PREMIUM_PLAN_PRICE_ID; // 🔥 add korte hobe process.env file e .
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




  */


  confirmPayment = catchAsync(async (req: Request, res: Response) => {
    const userAgent = req.headers['user-agent'];
    // Check if the request is from a mobile device
    const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);

    const deviceType = isMobile ? "Mobile" : "PC";
    
    const data : IConfirmPayment = {
      userId: req.query.userId,
      subscriptionPlanId: req.query.subscriptionId,
      amount: req.query.amount,
      duration: req.query.duration,
      // noOfDispatches: req.query.noOfDispatches, // 🟢🟢 kono ekta payment confirm korle .. amra jodi kono feature user ke provide korte chai .. like user 20 ta token pabe ... 
    };

    const paymentResult = await paymentTransactionService.confirmPayment(data);

    console.log('paymentResult 🔥🔥', paymentResult);

    if (paymentResult) {
    const subscription = await SubscriptionPlan.findOne({
      _id: paymentResult.subscriptionPlanId,
    });

    if (!subscription) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Subscription plan not found`
      );
    }

    if (deviceType !== "Mobile") {
      /*
        res.redirect(
          "${'http://127.0.0.1:3000'}/api/v1/subscription/payment-success"+
        "?amount=${paymentResult.amount}"+
        "&duration=${paymentResult.duration}"+
        "&subcriptionName=${paymentResult.subcriptionName}"+
        "&subscriptionId=${subscriptionPlan._id}",
        );
      */

        // &noOfDispatches=${subscription.noOfDispatches} 🟢🟢 kono feature provide korte chaile .. korte parbo .. 
      res.redirect(`http://127.0.0.1:3000/api/v1/payment-success?amount=${paymentResult.amount}&duration=${subscription?.initialDuration}&subcriptionName=${subscription?.subscriptionName}&subcriptionId=${subscription._id}`)
    }
  }


  sendResponse(res, {
      code: StatusCodes.OK,
      message: req.t("thank you for payment"),
      success: true,
    });
});

 confirmPaymentssInApp = catchAsync(async (req : Request, res: Response) => {
  const data : IConfirmPayment = {
    userId: req.user.userId,
    subscriptionId: req.body.subscriptionId,
    amount: req.body.amount,
    duration: req.body.duration,
    // noOfDispatches: req.body.noOfDispatches,
    paymentIntentId: req.body.paymentId,
  };

  const paymentResult = await paymentTransactionService.confirmPayment(data);

  sendResponse(res, {
      code: StatusCodes.OK,
      message: req.t("thank you for payment"),
      success: true,
      data: paymentResult,
    });
});




  // 2. Verify Session Completion (Client-side Success Page Handler)
verifyCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const { session_id } = req.query;
  
  if (!session_id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Session ID is required"
    );
  }
  
  // Retrieve the session to verify its status
  const session = await this.stripe.checkout.sessions.retrieve(session_id as string);
  
  if (session.payment_status !== 'paid') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Payment has not been completed"
    );
  }
  
  // Success verification can be minimal here as the webhook will handle the actual subscription creation
  sendResponse(res, {
    code: StatusCodes.OK,
    data: { verified: true },
    message: "Payment verified successfully",
    success: true,
  });
});


  subscribeFromFrontEnd = catchAsync(async (req: Request, res: Response) => {
    
  })

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
    const signature  = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Your webhook secret from Stripe Dashboard

    let event;

    event = this.stripe.webhooks.constructEvent(req.body, signature, endpointSecret);

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
      case 'checkout.session.completed': // 🟢
        // Handle successful subscription creation here
        console.log('Subscription created successfully:', event.data.object);
        await this.handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':  // 🟢
        console.log("Invoice payment succeeded:", event.data.object);
        await this.handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed': // 🟢
        // Event when the payment failed  due to card problem  or insufficient funds (every subscription interval )
        console.log('Invoice payment failed:', event.data);
        await this.handleInvoicePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.updated': // 🟢
        // Handle subscription update here
        console.log('Subscription updated:', event.data.object);
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted': // 🟢
        // Handle subscription cancellation here 
        console.log('Subscription canceled:', event.data.object);
        await this.handleSubscriptionCanceled(event.data.object);
        break;
      case 'invoice.paid':
        // Handle successful invoice payment here
        // Event when payment is successful (every subscription interval )
        console.log('Invoice paid:', event.data);
        break;
      
      case 'customer.subscription.trial_will_end':
        // Event when the trial period is about to end
        console.log('Trial period will end:', event.data.object);
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

  // ⚡⚡ For Fertie Project 
  /*
    As Admin can create subscription plan ...
    //[🚧][🧑‍💻✅][🧪] // 🆗
  */  
  create = catchAsync(async (req: Request, res: Response) => {
    const data : ISubscriptionPlan = req.body;
    
    data.subscriptionName = req.body.subscriptionName;
    data.amount = req.body.amount;
    data.subscriptionType = SubscriptionType.premium;
    data.initialDuration = InitialDurationType.month;
    data.renewalFrequncy = RenewalFrequncyType.monthly;
    data.currency = CurrencyType.USD;
    data.features = req.body.features;
    // zod diye validation kora ase .. 
    // if(!data.amount){
    //   throw new ApiError(
    //     StatusCodes.BAD_REQUEST,
    //     `amount is required`
    //   );
    // }

    // now we have to create stripe product and price 
    // and then we have to save the productId and priceId in our database
    const product = await this.stripe.products.create({
      name: data.subscriptionType,
      description: `Subscription plan for ${data.subscriptionType}`,
    });

    const price = await this.stripe.prices.create({
      unit_amount: Math.round(parseFloat(data?.amount) * 100), // Amount in cents
      currency: data.currency,
      // -- as i dont want to make this recurring ... 
      // recurring: {
      //   interval: 'month', // or 'year' for yearly subscriptions
      //   interval_count: 1, // Number of intervals (e.g., 1 month)
      // },
      product: product.id,
    });
    data.stripe_product_id = product.id;
    data.stripe_price_id = price.id;
    data.isActive = true;

    const result = await this.service.create(data);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  }
  );

  /*
    if admin wants to update a subscription plan , 
    then we have to create new stripe product and price and update the productId and priceId in our database

    lets see how it goes .. we can modify it later if needed
  */  

  updateById = catchAsync(async (req: Request, res: Response) => {
    const data : ISubscriptionPlan = req.body;
    
    data.subscriptionName = req.body.subscriptionName;
    data.amount = req.body.amount;
    data.subscriptionType = SubscriptionType.premium;
    data.initialDuration = InitialDurationType.month;
    data.renewalFrequncy = RenewalFrequncyType.monthly;
    data.currency = CurrencyType.USD;
    data.features = req.body.features;

    if(!data.amount){
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `amount is required`
      );
    }

    // now we have to create stripe product and price 
    // and then we have to save the productId and priceId in our database
    const product = await this.stripe.products.create({
      name: data.subscriptionType,
      description: `Subscription plan for ${data.subscriptionType}`,
    });

    const price = await this.stripe.prices.create({
      unit_amount: data?.amount * 100, // Amount in cents
      currency: data.currency,
      recurring: {
        interval: 'month', // or 'year' for yearly subscriptions
        interval_count: 1, // Number of intervals (e.g., 1 month)
      },
      product: product.id,
    });
    
    data.stripe_product_id = product.id;
    data.stripe_price_id = price.id;

    const result = await this.service.updateById(req.params.id, data);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} updated successfully`,
      success: true,
    });
  });


  createCheckoutSession = catchAsync(async (req, res) => {
    
      const { planId } = req.body;
      const userId = req.user._id;
      
      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          `Plan not found`
        );
      }
      
      // Get or create Stripe customer
      let user = await userCustomService.getById(userId);
      if(!user){
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          `User not found`
        );
      }
      if (!user?.stripeCustomerId) {
        const customer = await this.stripe.customers.create({
          email: user.email,
          name: user.name || user.email,
          metadata: {
            userId: user._id.toString()
          }
        });
        
        user.stripeCustomerId = customer.id;
        await user.save();
      }
      
      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer: user.stripeCustomerId,
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
        metadata: {
          userId: user._id.toString(),
          planId: plan._id.toString()
        }
      });
      
      res.status(200).json({ success: true, sessionId: session.id, url: session.url });
   
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
