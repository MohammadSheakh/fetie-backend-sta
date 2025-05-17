import mongoose from 'mongoose';
import { cronService } from '../../cron/cron.service';
import { Conversation } from './conversation.model';
import { MessagerService } from '../message/message.service';
import { RoleType } from '../message/message.constant';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';


let messageService = new MessagerService();

export const initConversationCronJobs = (): void => {
  // Schedule daily message by bot to all conversations at 9:00 AM
  // You can adjust the schedule as needed - this example is daily at 9 AM

  console.log('⌛Scheduling daily message to all conversations at 9:00 AM  ⌛');

  cronService.schedule(
    'daily-conversation-message',
    '0 9 * * *', // At 9:00 AM every day
    //'*/1 * * * *', // This will run every minute for testing
    sendDailyMessageToAllConversations
  );

  // Add any other conversation-related cron jobs here
}

/**
 * Sends a message to all conversations
 */
export const sendDailyMessageToAllConversations = async (): Promise<void> => {
  try {
    console.log('Running cron job: sendDailyMessageToAllConversations');
    
    // Get bot ID from environment variable or config
    const botId = process.env.BOT_USER_ID || '68206aa9e791351fc9fdbcde';
    
    // Fetch all active conversations (you may want to add filters)
    const conversations = await Conversation.find({
      // You can add criteria here to filter conversations
      // For example: { createdAt: { $gte: someDate } }
    }).select('_id');
    
    console.log(`Found ${conversations.length} conversations to send messages to`);
    
    // Prepare messages to send - you could have different message variations
    const messages = [
      "How are you feeling today?",
      "Hope you're having a good day!",
      "Just checking in. How are things going?",
      "How's your day going so far?",
    ];
    
    // Send messages to each conversation
    for (const conversation of conversations) {
      try {
        // Select a random message from the array
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        await messageService.create({
          text: randomMessage,
          senderId: new mongoose.Types.ObjectId(botId),
          conversationId: conversation._id,
          senderRole: RoleType.bot
        });
        
        // console.log(`Message sent to conversation: ${conversation._id}`);
      } catch (error) {
        console.error(`Failed to send message to conversation ${conversation._id}:`, error);
        // Continue with other conversations even if one fails
      }
    }
    
    console.log('Completed sending daily messages to all conversations');
  } catch (error) {
    console.error('Error in sendDailyMessageToAllConversations cron job:', error);
  }
};

