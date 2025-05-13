import { GenericService } from "../../__Generic/generic.services";
import { PaymentTransaction } from "./paymentTransaction.model";
import { IPaymentTransaction } from "./paymentTransaction.interface";
import { UserSubscription } from "../../_subscription/userSubscription/userSubscription.model";
import crypto from 'crypto';
import { IConfirmPayment } from "../../_subscription/subscriptionPlan/subscriptionPlan.interface";

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
        subscriptionId,
        amount,
        duration,
        // noOfDispatches,  // 🟢🟢 kono ekta payment confirm korle .. amra jodi kono feature user ke provide korte chai .. like user 20 ta token pabe ... 
        paymentIntentId,
      } = data;

      // Generate a random ID of 16 bytes, converted to hexadecimal
      const paymentId = `pi_${crypto.randomBytes(16).toString("hex")}`;

      const paymentDataBody : IPaymentTransaction = {
        externalTransactionOrPaymentId: paymentIntentId ? paymentIntentId : paymentId,
        amount,
        subscriptionId: subscriptionId,
        userId: userId,
        paymentMethodOrProcessorOrGateway: "stripe", // "Card" mahin vai ekhane eta likhsilo
      };

      let paymentData : IPaymentTransaction;

      try {
        // Save payment data
        paymentData = new PaymentTransaction(paymentDataBody);

        await paymentData.save();

        // // Set the expiry date (today's date + duration) in YYYY-MM-DD format

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to midnight
        const expiryDate = new Date(today);
        expiryDate.setDate(today.getDate() + Number(duration));

        // // Extract date in YYYY-MM-DD format
        const formattedExpiryDate = expiryDate.toISOString().split("T")[0];

        // // Check if the user already has a subscription in MySubscription
        const existingUserSubscription =
          (await UserSubscription.findOne({ user: userId })) ?? false;

        if (existingUserSubscription) {
          // Update the existing subscription
          existingUserSubscription.subscriptionPlanId = subscriptionId;
          existingUserSubscription.expirationDate = formattedExpiryDate;
          
          await existingUserSubscription.save();
        } else {
          // Create a new subscription
          const newSubscription = new UserSubscription({
            user: userId,
            subscription: subscriptionId,
            expiryDate: formattedExpiryDate,
          });
          await newSubscription.save();
        }
      } catch (error) {
        console.error("Error in confirmPayment:", error);
        throw new Error("Failed to process the payment and subscription.");
      }

      return paymentData;
    };

}