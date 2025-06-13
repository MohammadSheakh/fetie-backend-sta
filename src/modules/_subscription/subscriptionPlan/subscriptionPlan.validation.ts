import { z } from 'zod';
import { SubscriptionType } from './subscriptionPlan.constant';

export const createSubscriptionPlanValidationSchema = z.object({
  body: z.object({
    subscriptionName: z  
    .string({
        required_error: 'subscriptionName is required, subscriptionName must be a string.',
        invalid_type_error: 'subscriptionName must be a string.',
      }).max(500, {
      message: 'subscriptionName must be at most 100 characters long.',
    }),
    amount: z
    .string({
        required_error: 'amount is required, amount must be a string.',
        invalid_type_error: 'amount must be a string.',
      }),
      // .min(0, {
      // message: 'amount must be greater than zero.',
      
      subscriptionType: z.string({
        required_error: 'subscriptionType is required, subscriptionType must be a string.',
        invalid_type_error: 'subscriptionType must be a string.',
      })
      .refine(subscriptionType => Object.keys(SubscriptionType).includes(subscriptionType as keyof typeof SubscriptionType), {
        message: `subscriptionType must be one of the following: ${Object.keys(SubscriptionType).join(', ')}`,
      }),

    features: z.array(z.string({
      required_error: 'features is required, features must be an array of strings.',
      invalid_type_error: 'features must be an array of strings.',
    })),
    
    }),
     // params: z.object({
    //   id: z.string().optional(),
    // }),
    // query: z.object({
    //   page: z.string().optional(),
    // }),
  })

  export const subscribeFromFrontEndValidationSchema = z.object({
  body: z.object({
    subscriptionPlanId: z  
    .string({
        required_error: 'subscriptionName is required, subscriptionName must be a string.',
        invalid_type_error: 'subscriptionName must be a string.',
      }).max(500, {
      message: 'subscriptionName must be at most 100 characters long.',
    }),

    stripeData: z.object({
      stripe_subscription_id: z.string({
        required_error: 'stripe_subscription_id is required',
        invalid_type_error: 'stripe_subscription_id must be a string',
      }),
      stripe_payment_intent_id: z.string({
        required_error: 'stripe_payment_intent_id is required',
        invalid_type_error: 'stripe_payment_intent_id must be a string',
      })
    }, {
      required_error: 'stripeData is required and must be an object it contains stripe_subscription_id, stripe_payment_intent_id ', 
      invalid_type_error: 'stripeData must be an object',
    })
  }),
    // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
  })

 
  export const subscribeFromBackEndValidationSchema = z.object({
    body: z.object({
      
    }),
      // params: z.object({
    //   id: z.string().optional(),
    // }),
    query: z.object({
      subscriptionPlanId: z.string(
        {
          required_error: 'subscriptionPlanId is required in query',
          invalid_type_error: 'subscriptionPlanId must be a string and required in query',
        }),
    }),
})

 






