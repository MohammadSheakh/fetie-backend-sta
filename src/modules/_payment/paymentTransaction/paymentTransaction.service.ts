import { GenericService } from "../../__Generic/generic.services";
import { PaymentTransaction } from "./paymentTransaction.model";
import { IPaymentTransaction } from "./paymentTransaction.interface";
import { UserSubscription } from "../../_subscription/userSubscription/userSubscription.model";
import crypto from 'crypto';
import { IConfirmPayment } from "../../_subscription/subscriptionPlan/subscriptionPlan.interface";
import { UserSubscriptionStatusType } from "../../_subscription/userSubscription/userSubscription.constant";
import { TPaymentStatus } from "./paymentTransaction.constant";
import { CurrencyType } from "../../_subscription/subscriptionPlan/subscriptionPlan.constant";

export class PaymentTransactionService extends GenericService<typeof PaymentTransaction, IPaymentTransaction>
{
    constructor(){
        super(PaymentTransaction)
    }

    // confirmPayment = async (subscriptionType: string) => {
    //     return await this.model.findOne({ subscriptionType });
    // }

    confirmPayment = async (data : IConfirmPayment) => {
      const {
        userId,
        subscriptionPlanId,
        amount,
        duration,
        // noOfDispatches,  // 🟢🟢 kono ekta payment confirm korle .. amra jodi kono feature user ke provide korte chai .. like user 20 ta token pabe ... 
        stripe_payment_intent_id,
      } = data;

      // Generate a random ID of 16 bytes, converted to hexadecimal
      const _paymentIntentId = `pi_${crypto.randomBytes(16).toString("hex")}`;

      const paymentDataBody : IPaymentTransaction = {
        // externalTransactionOrPaymentId
        stripe_payment_intent_id: stripe_payment_intent_id ? stripe_payment_intent_id : _paymentIntentId,
        amount,
        subscriptionPlanId: subscriptionPlanId,
        userId: userId,
        paymentMethodOrProcessorOrGateway: "stripe", // "Card" mahin vai ekhane eta likhsilo
      };

      let paymentData : IPaymentTransaction;

      try {
        

        ////////////// Set Expiry Date ////////////
        const today = new Date();
        console.log("today", today);

        // Reset time to midnight
        today.setHours(0, 0, 0, 0);

        const expiryDate = new Date(today);
        console.log("expiryDate before adding month", expiryDate);

        // If duration is 'month', add 1 month to today's date
        if (duration === 'month') {
          expiryDate.setMonth(today.getMonth() + 1); // Adds 1 month
        }

        console.log("expiryDate after adding month", expiryDate);

        // Store as a full ISO string (with time and timezone)
        const isoFormattedExpiryDate = expiryDate.toISOString();
        console.log("ISO Formatted Expiry Date", isoFormattedExpiryDate);


        // // Check if the user already has a subscription in MySubscription
        const existingUserSubscription = await UserSubscription.findOne({ userId: userId , subscriptionPlanId : subscriptionPlanId });

        let savedUserSubscription;
        if (existingUserSubscription) {

          console.log("🎯🎯 if block userSubscription")

          existingUserSubscription.status = UserSubscriptionStatusType.active;
          // Update the existing subscription
          existingUserSubscription.subscriptionPlanId = subscriptionPlanId;
          existingUserSubscription.billingCycle = Number(existingUserSubscription.billingCycle) + 1; 

          if(existingUserSubscription.billingCycle == 1){
            existingUserSubscription.subscriptionStartDate = new Date();
            existingUserSubscription.currentPeriodStartDate = new Date();
          }else{
            existingUserSubscription.currentPeriodStartDate = new Date();
          }
          existingUserSubscription.expirationDate = expiryDate;
          existingUserSubscription.renewalDate = expiryDate;
          
          savedUserSubscription = await existingUserSubscription.save();
        } else {

          console.log("🎯🎯 else block userSubscription")

          // Create a new subscription
          const newSubscription = new UserSubscription({
            userId: userId,
            subscriptionPlanId: subscriptionPlanId,
            expiryDate: expiryDate,
          });

          newSubscription.billingCycle = Number(newSubscription.billingCycle) + 1;

          if(newSubscription.billingCycle == 1){
            newSubscription.subscriptionStartDate = new Date();
            newSubscription.currentPeriodStartDate = new Date();
          }
          newSubscription.status = UserSubscriptionStatusType.active;
          newSubscription.expirationDate = expiryDate;
          newSubscription.renewalDate = expiryDate;
        
          savedUserSubscription =  await newSubscription.save();
        }



        // Save payment data
        paymentDataBody.currency = CurrencyType.USD; // Set the currency to USD
        paymentDataBody.type = "subscription"; // Set the type to "subscription"
        paymentDataBody.paymentStatus = TPaymentStatus.succeeded
        paymentDataBody.userSubscriptionId = savedUserSubscription._id; // Save the user subscription ID

        paymentData = await this.create(paymentDataBody);


      } catch (error) {
        console.error("Error in confirmPayment:", error);
        throw new Error("Failed to process the payment and subscription.");
      }

      return paymentData;
    };

}