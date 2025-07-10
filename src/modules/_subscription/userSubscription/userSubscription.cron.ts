import { cronService } from '../../cron/cron.service';
import { TStatusType, TSubscriptionType } from '../../user/user.constant';
import { User } from '../../user/user.model';
import { UserSubscriptionStatusType } from './userSubscription.constant';
import { UserSubscription } from './userSubscription.model';

export const initUserSubscriptionCron = ():void => {
  /*****************
   * schedule a cron job to run every day 
   * to check expired userSubscription and 
   * 
   * check if cancelledAtPeriodEnd false 
   * then check if expirationDate is less than today
   * then update cancelledAt to that days date 
   * and set cancelledAtPeriodEnd to true
   * 
   * --
   * 
   * also change status to cancelled
   * also update Users subscriptionType to free ... 
   * 
   ****************/

   console.log('⌛Scheduling expire userSubscription every day .. ⌛');
   cronService.schedule(
    'expire-user-subscription',
    // '0 0 * * *', // At 00:00 AM every day'
     '*/60 * * * *', // every 60 minute for testing
    "This will run every minute for testing", // additional message
    checkAndExpireUserSubscription
  );  

}

export const checkAndExpireUserSubscription = async (): Promise<void> => {
  try {
    console.log('Running cron job: checkAndExpireUserSubscription');
    
    // Get the current date
    const currentDate = new Date();
    
    // Find all user subscriptions that are not cancelled at period end and have expired
    const expiredSubscriptions = await UserSubscription.find({
      cancelledAtPeriodEnd: false,
      expirationDate: { $lt: currentDate },
    });
    
    console.log(`Found ${expiredSubscriptions.length} expired subscriptions to process`);
    
    // Process each expired subscription
    for (const subscription of expiredSubscriptions) {
      try {
        // Update the subscription to set cancelledAt and cancelledAtPeriodEnd
        subscription.cancelledAt = currentDate;
        subscription.cancelledAtPeriodEnd = true;
        subscription.status = UserSubscriptionStatusType.cancelled;
        
        await subscription.save();
        
        // Update the user's subscription type to free
        await User.findByIdAndUpdate(subscription.userId, { subscriptionType: 'free' });
        
        console.log(`Updated subscription for user ${subscription.userId}`);
      } catch (error) {
        console.error(`Error processing subscription ${subscription._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in cron job checkAndExpireUserSubscription:', error);
  }
}