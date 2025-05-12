import Stripe from "stripe";
import { GenericService } from "../../__Generic/generic.services";
import { ISubscriptionPlan } from "./subscriptionPlan.interface";
import { SubscriptionPlan } from "./subscriptionPlan.model";

export class SubscriptionPlanService extends GenericService<typeof SubscriptionPlan, ISubscriptionPlan>
{
    private stripe : Stripe

    constructor(){
        super(SubscriptionPlan)
         // Initialize Stripe with secret key (from your Stripe Dashboard) // https://dashboard.stripe.com/test/dashboard
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string );
    }

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
  


    }
}