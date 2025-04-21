import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { GenericController } from '../../__Generic/generic.controller';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { PersonalizedJourneyService } from './personalizeJourney.service';
import { PersonalizeJourney } from './personalizeJourney.model';
import { IPersonalizeJourney } from './personalizeJourney.interface';

// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class PersonalizedJourneyController extends GenericController<typeof PersonalizeJourney, IPersonalizeJourney> {
  personalizedJourneyService = new PersonalizedJourneyService();

  constructor() {
    super(new PersonalizedJourneyService(), 'Personalize Journey');
  }

  saveOptionalInformation = catchAsync(async (req: Request, res: Response) => {
    const data = req.body;

    if(!req.user){
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found');
    }

    const userId = req.user.userId;


    

     await this.personalizedJourneyService.saveOptionalInformation(data, userId);
    //  const result =
    //  if (!result) {
    //   throw new ApiError(StatusCodes.BAD_REQUEST, 'Can not save optional information');
    // }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: null, // result
      message: 'Optional information saved successfully',
      success: true,
    });
  })

  // add more methods here if needed or override the existing ones
}
