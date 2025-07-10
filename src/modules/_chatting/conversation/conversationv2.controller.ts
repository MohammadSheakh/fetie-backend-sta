import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { GenericController } from '../../__Generic/generic.controller';
import { Conversation } from './conversation.model';
import { ConversationService } from './conversation.service';
import { StatusCodes } from 'http-status-codes';
import { ConversationParticipentsService } from '../conversationParticipents/conversationParticipents.service';
import ApiError from '../../../errors/ApiError';
import { IConversation } from './conversation.interface';
import { ConversationType } from './conversation.constant';
import { MessagerService } from '../message/message.service';
import { IMessage } from '../message/message.interface';
import { RoleType } from '../conversationParticipents/conversationParticipents.constant';
import { User } from '../../user/user.model';
import { format } from 'date-fns';
import mongoose from 'mongoose';
import { sendDailyMessageToAllConversations } from './conversation.cron';
import { Message } from '../message/message.model';

let conversationParticipantsService = new ConversationParticipentsService();
let messageService = new MessagerService();

export class ConversationV2Controller extends GenericController<typeof Conversation, IConversation> {
  conversationService = new ConversationService();

  constructor() {
    super(new ConversationService(), 'Conversation');
  }


  //  FIX : lastMessageSenderRole fix korte hobe .. 
  // override  // 2️⃣
  create = catchAsync(async (req: Request, res: Response) => {
    let type;
    let result: IConversation;
    
    let { participants, message } = req.body; // type, attachedToId, attachedToCategory

    if (!participants) {
      
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Without participants you can not create a conversation'
      );
    }

    participants = [...participants, req.user.userId]; // add yourself to the participants list

    
    if (participants.length > 0) {
      type =
        participants.length > 2
          ? ConversationType.group
          : ConversationType.direct;

      const conversationData: IConversation = {
        creatorId: req.user.userId,
        type,
        month: format(new Date(), 'LLLL'), // format(new Date(), 'LLLL')
        year: new Date().getFullYear() //2026 , // new Date().getFullYear()
      };

      // check if the conversation already exists
      const existingConversation = await Conversation.findOne({
        creatorId: conversationData.creatorId,
        month: conversationData.month,
        year: conversationData.year,
      }).select('-isDeleted -updatedAt -createdAt -__v');

      if (!existingConversation){
        ////////// Create a new conversation

        result = await this.service.create(conversationData); // 🎯🎯🎯🎯

        if (!result) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            'Unable to create conversation'
          );
        }

        for (const participant of participants) {
          

          // as participants is just an id .. 

          let user = await User.findById(participant).select('role');

          const res1 = await conversationParticipantsService.create({
            userId: participant,
            conversationId: result?._id,
            role: user?.role === RoleType.user ? RoleType.user : RoleType.bot, // 🔴 ekhane jhamela ase .. 
          });

          if (!res1) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              'Unable to create conversation participant'
            );
          }
        }

        if (message && result?._id) {
          const res1: IMessage | null = await messageService.create({
            text: message,
            senderId: req.user.userId,
            conversationId: result?._id,
            senderRole: req.user.role === RoleType.user ? RoleType.user : RoleType.bot,
          });
          if (!res1) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              'Unable to create conversation participant'
            );
          }
        }

        if(!message){
          const res1: IMessage | null = await messageService.create({
            text: "How are you feeling today ?",
            senderId: new mongoose.Types.ObjectId('68206aa9e791351fc9fdbcde'),  // this is bot id .. eta process.env file theke ashbe .. 
            conversationId: result?._id,
            senderRole: RoleType.bot,
          });

          // also update the last message of the conversation 
          await Conversation.findByIdAndUpdate(
            result?._id,
            { lastMessageSenderRole: RoleType.bot}, // FIX ME : last message sender role fix korte hobe .. 
            { new: true }
          ).select('-isDeleted -updatedAt -createdAt -__v');
        }
      }

      // dont need to create conversation .. 
      // just send message to the existing conversation

      let res1 ;
      if (message && existingConversation?._id) {
          let res1 : IMessage | null = await messageService.create({
            text: message,
            senderId: req.user.userId,
            conversationId: existingConversation?._id,
            senderRole: req.user.role === RoleType.user ? RoleType.user : RoleType.bot,
          });
          if (!res1) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              'Unable to create conversation participant'
            );
          }
        }

      sendResponse(res, {
        code: StatusCodes.OK,
        data: existingConversation ? existingConversation : result,
        message: existingConversation ?  `${this.modelName} already exist` : `${this.modelName} created successfully`,
        success: true,
      });
    }
  });

  // this trigger Cron Job is For Manual Testing:
  triggerCronJob = catchAsync(async (req: Request, res: Response) => {
  try {
    await sendDailyMessageToAllConversations();
    
    sendResponse(res, {
      code: StatusCodes.OK,
      message: 'Cron job triggered successfully',
      success: true,
    });
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to trigger cron job'
    );
  }
  });


  // 🟢 this is already available in message module 
  getAllMessagesOfAConversation = catchAsync(
  async (req: Request, res: Response) => {
    const { conversationId } = req.params;

    if (!conversationId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Conversation ID is required'
      );
    }

    const previousMessageHistory: IMessage[] | null =
          await Message.find({
            conversationId
    }).select('-conversationId -__v -updatedAt') /*.populate("text senderRole conversationId") */;

    sendResponse(res, {
      code: StatusCodes.OK,
      data: previousMessageHistory,
      message: 'Messages retrieved successfully',
      success: true,
    });
  })
  // add more methods here if needed or override the existing ones
}
