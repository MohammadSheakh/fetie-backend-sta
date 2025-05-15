import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { GenericController } from '../../__Generic/generic.controller';
import { Conversation } from './conversation.model';
import { ConversationService } from './conversation.service';
import { StatusCodes } from 'http-status-codes';
import { ConversationParticipentsService } from '../conversationParticipents/conversationParticipents.service';
import ApiError from '../../../errors/ApiError';
import { IConversation, IConversationModel } from './conversation.interface';
import { ConversationType } from './conversation.constant';
import { IConversationParticipents } from '../conversationParticipents/conversationParticipents.interface';
import { MessagerService } from '../message/message.service';
import { IMessage } from '../message/message.interface';
import { RoleType } from '../conversationParticipents/conversationParticipents.constant';
import { User } from '../../user/user.model';

let conversationParticipantsService = new ConversationParticipentsService();
let messageService = new MessagerService();

export class ConversationController extends GenericController<typeof Conversation, IConversation> {
  conversationService = new ConversationService();

  constructor() {
    super(new ConversationService(), 'Conversation');
  }

  // override // 1️⃣
  create = catchAsync(async (req: Request, res: Response) => {
    let type;
    // creatorId ta req.user theke ashbe
    //req.body.creatorId = req.user.userId;
    let { participants, message } = req.body; // type, attachedToId, attachedToCategory

    // type is based on participants count .. if count is greater than 2 then group else direct

    if (!participants) {
      // 🔥 test korte hobe logic ..
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Without participants you can not create a conversation'
      );
    }

    participants = [...participants, req.user.userId]; // add yourself to the participants list

    let result: IConversation;
    if (participants.length > 0) {
      type =
        participants.length > 2
          ? ConversationType.group
          : ConversationType.direct;

      const conversationData: IConversation = {
        creatorId: req.user.userId,
        type,
        // attachedToId,
        // attachedToCategory,
      };

      // check if the conversation already exists
      const existingConversation = await Conversation.findOne({
        creatorId: req.user.userId,
      });

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
          // try {
          console.log('🔥🔥participants🔥', participants);

          // as participants is just an id .. 

          let user = await User.findById(participant).select('role');

          console.log(
            '🔥🔥user role  🔥',
            user,
            user?.role,)

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

          console.log('🔥🔥res1🔥', res1);
          // } catch (error) {
          // console.error("Error creating conversation participant:", error);
          // }
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
        data: result ? result : res1,
        message: `${this.modelName} created successfully`,
        success: true,
      });
    }
  });

  addParticipantsToExistingConversation = catchAsync(
    async (req: Request, res: Response) => {
      console.log(
        '🧪------------' + new Date().toLocaleString() + '-----------////--🧪'
      );
      const {
        participants,
        conversationId,
      }: { participants: string[]; conversationId: string } = req.body;

      const conversation = await this.service.getById(conversationId);
      if (!conversation) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Conversation not found');
      }

      let result;

      console.log('participants.length 🧪🧪🧪', participants.length);
      if (participants.length > 0) {
        for (const participantId of participants) {
          if (participantId !== req.user.userId) {
            const existingParticipant =
              await conversationParticipantsService.getByUserIdAndConversationId(
                participantId,
                conversationId
              );
            console.log(
              'existingParticipant 🧪🧪',
              existingParticipant,
              existingParticipant.length
            );
            if (existingParticipant.length == 0) {
              await conversationParticipantsService.create({
                userId: participantId,
                conversationId: conversation?._id,
                role: req.user.role === 'user' ? 'member' : 'admin',
              });

              sendResponse(res, {
                code: StatusCodes.OK,
                data: null,
                message: `Participents ${participantId}  added successfully  ${this.modelName}.. ${conversationId}`,
                success: true,
              });
            }
            sendResponse(res, {
              code: StatusCodes.OK,
              data: null,
              message: `Participents ${participantId} can not be added  ${this.modelName}.. ${conversationId}`,
              success: true,
            });
          }
        }

        // const promises = participants.map(async (participantId) => {
        //   if (participantId !== req.user.userId) {
        //     const existingParticipant = await conversationParticipantsService.getByUserIdAndConversationId(participantId, conversationId);
        //     console.log("existingParticipant 🧪🧪", existingParticipant)
        //     if (existingParticipant.length == 0) {
        //       await conversationParticipantsService.create({
        //         userId: participantId,
        //         conversationId,
        //         role: req.user.role === 'user' ? 'member' : 'admin',
        //       });
        //     }
        //   }
        // });

        // await Promise.all(promises);
      }
      //   else{

      //     if (participants[0] !== req.user.userId) {

      //       // check if the participant is already in the conversation
      //       const existingParticipant = await conversationParticipantsService.getByUserIdAndConversationId(participants[0], conversationId);

      //       console.log("existingParticipant 🧪🧪", existingParticipant)
      //       if(existingParticipant.length === 0){

      //       result = await conversationParticipantsService.create({
      //         userId: participants[0],
      //         conversationId: conversation?._id,
      //         role: req.user.role === 'user' ? 'member' : 'admin',
      //       });

      //       if (!result) {
      //         throw new ApiError(
      //           StatusCodes.BAD_REQUEST,
      //           'Unable to add participant.'
      //         );
      //       }
      //     }
      //   }
      //   sendResponse(res, {
      //     code: StatusCodes.OK,
      //     data: null,
      //     message: `Participents added successfully to this ${this.modelName}.. ${conversationId}`,
      //     success: true,
      //   });
      // }
    }
  );

  showParticipantsOfExistingConversation = catchAsync(
    async (req: Request, res: Response) => {
      const { conversationId } = req.query;

      if (!conversationId) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Without conversationId you can not show participants'
        );
      }

      const conversation = await this.service.getById(conversationId);
      if (!conversation) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Conversation not found');
      }

      const res1 = await conversationParticipantsService.getByConversationId(
        conversationId
      );

      if (!res1) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'no participants found in this conversation'
        );
      }

      // 🔥🔥 Multiple er jonno o handle korte hobe .. single er jonno o handle korte hobe ..
      sendResponse(res, {
        code: StatusCodes.OK,
        data: res1,
        message: `Participents found successfully to this ${this.modelName}.. ${conversationId}`,
        success: true,
      });
    }
  );

  removeParticipantFromAConversation = catchAsync(
    async (req: Request, res: Response) => {
      const { conversationId, participantId } = req.body;

      if (!conversationId || !participantId) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Without conversationId and participantId you can not remove participants'
        );
      }

      const conversation = await this.service.getById(conversationId);
      if (!conversation) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Conversation not found');
      }

      const res1 =
        await conversationParticipantsService.getByUserIdAndConversationId(
          participantId,
          conversationId
        );

      if (!res1) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'no participants found in this conversation'
        );
      }

      const result = await conversationParticipantsService.deleteById(
        res1[0]._id
      );

      if (!result) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Unable to remove participant from the conversation.'
        );
      }

      sendResponse(res, {
        code: StatusCodes.OK,
        data: null,
        message: `Participant removed successfully from this ${this.modelName}.. ${conversationId}`,
        success: true,
      });
    }
  );


  // add more methods here if needed or override the existing ones
}
