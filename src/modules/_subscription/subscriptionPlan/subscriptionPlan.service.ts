import Stripe from "stripe";
import { GenericService } from "../../__Generic/generic.services";
import { ISubscriptionPlan } from "./subscriptionPlan.interface";
import { SubscriptionPlan } from "./subscriptionPlan.model";
import { UserSubscriptionService } from "../userSubscription/userSubscription.service";

export class SubscriptionPlanService extends GenericService<typeof SubscriptionPlan, ISubscriptionPlan>
{
    private stripe : Stripe
    
    constructor(){
        super(SubscriptionPlan)
         // Initialize Stripe with secret key (from your Stripe Dashboard) // https://dashboard.stripe.com/test/dashboard
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string );
    }

    userSubscriptionService = new UserSubscriptionService()

    getBySubscriptionType = async (subscriptionType: string) => {
        return await this.model.findOne({ subscriptionType });
    }

    // 4. Helper Methods for Different Webhook Events
    // 4.1 Handle Checkout Session Completed
    handleCheckoutSessionCompleted = async (session: any) => {
        // Implement your logic here
        console.log("Checkout session completed:", session);
        const { userId, subscriptionPlanId } = session.metadata;
  
        if (!userId || !subscriptionPlanId) {
            console.error('Missing metadata in checkout session');
            return;
        }

        // Retrieve subscription details from Stripe
        const subscription = await this.stripe.subscriptions.retrieve(session.subscription);
  
        // Get subscription plan details
        const subscriptionPlan = await this.getById(subscriptionPlanId);
        
        // Calculate dates
        const now = new Date();
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

        // Create user subscription record
        const userSubscriptionData = {
            userId,
            subscriptionPlanId,
            subscriptionStartDate: now,
            currentPeriodStartDate: now,
            renewalDate: currentPeriodEnd,
            billingCycle: subscriptionPlan.initialDuration === 'month' ? 1 : 12,
            isAutoRenewed: true,
            status: UserSubscriptionStatusType.active,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer
        };

       
        // Create subscription in your database
        await this.userSubscriptionService.create(userSubscriptionData); 

    }


    handleInvoicePaymentSucceeded = async (invoice: any) => {
        if (!invoice.subscription) return;
  
        // Get user subscription by Stripe subscription ID
        const userSubscription = await userSubscriptionService.getByStripeSubscriptionId(invoice.subscription);
        
        if (!userSubscription) {
            console.error('User subscription not found for invoice payment', invoice.subscription);
            return;
        }

        // Calculate new period dates
        const currentPeriodStart = new Date(invoice.period_start * 1000);
        const renewalDate = new Date(invoice.period_end * 1000);

        // Update user subscription
        await userSubscriptionService.update(userSubscription._id, {
            currentPeriodStartDate: currentPeriodStart,
            renewalDate: renewalDate,
            status: UserSubscriptionStatusType.active
        });
    }

    handleInvoicePaymentFailed = async (invoice: any) => {
        if (!invoice.subscription) return;
  
        // Get user subscription by Stripe subscription ID
        const userSubscription = await userSubscriptionService.getByStripeSubscriptionId(invoice.subscription);
        
        if (!userSubscription) {
            console.error('User subscription not found for failed payment', invoice.subscription);
            return;
        }

        // Update status to past_due
        await userSubscriptionService.update(userSubscription._id, {
            status: UserSubscriptionStatusType.past_due
        });
        
        // Here you might want to trigger a notification to the user
    }

    // 4.4 Handle Subscription Updated
    handleSubscriptionUpdated = async (subscription: any) => {
        // Get user subscription by Stripe subscription ID
        const userSubscription = await userSubscriptionService.getByStripeSubscriptionId(subscription.id);
        
        if (!userSubscription) {
            console.error('User subscription not found for update', subscription.id);
            return;
        }

        // Update status and other details
        const updates: any = {};
        
        // Map Stripe status to your status
        switch (subscription.status) {
            case 'active':
            updates.status = UserSubscriptionStatusType.active;
            break;
            case 'past_due':
            updates.status = UserSubscriptionStatusType.past_due;
            break;
            case 'unpaid':
            updates.status = UserSubscriptionStatusType.unpaid;
            break;
            case 'canceled':
            updates.status = UserSubscriptionStatusType.cancelled;
            updates.cancelledAt = new Date();
            break;
            case 'trialing':
            updates.status = UserSubscriptionStatusType.trialing;
            break;
            case 'incomplete':
            updates.status = UserSubscriptionStatusType.incomplete;
            break;
            case 'incomplete_expired':
            updates.status = UserSubscriptionStatusType.incomplete_expired;
            break;
        }

        // Handle cancellation at period end
        if (subscription.cancel_at_period_end) {
            updates.cancelledAtPeriodEnd = true;
        } else {
            updates.cancelledAtPeriodEnd = false;
        }

        // Update current period dates if available
        if (subscription.current_period_start) {
            updates.currentPeriodStartDate = new Date(subscription.current_period_start * 1000);
        }
        
        if (subscription.current_period_end) {
            updates.renewalDate = new Date(subscription.current_period_end * 1000);
        }

        // Update subscription in database
        await userSubscriptionService.update(userSubscription._id, updates);
    }

    /*
    // 4.5 Handle Subscription Canceled
private async handleSubscriptionCanceled(subscription: any) {
  // Get user subscription by Stripe subscription ID
  const userSubscription = await userSubscriptionService.getByStripeSubscriptionId(subscription.id);
  
  if (!userSubscription) {
    console.error('User subscription not found for cancellation', subscription.id);
    return;
  }

  // Update subscription status
  await userSubscriptionService.update(userSubscription._id, {
    status: UserSubscriptionStatusType.cancelled,
    cancelledAt: new Date()
  });
}

// 5. Service Methods for User Subscription
// Example method to find by Stripe subscription ID
userSubscriptionService.getByStripeSubscriptionId = async (stripeSubscriptionId: string) => {
  return await UserSubscription.findOne({ 
    stripe_subscription_id: stripeSubscriptionId,
    isDeleted: false 
  });
};


*/
}