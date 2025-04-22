import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { GenericController } from '../../__Generic/generic.controller';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { PersonalizedJourneyService } from './personalizeJourney.service';
import { PersonalizeJourney } from './personalizeJourney.model';
import { IPersonalizeJourney } from './personalizeJourney.interface';
import { User } from '../../user/user.model';

// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

function calculatePeriodEndDate(periodStartDate : Date, periodLength : number) {
  // Convert periodStartDate to a Date object
  const startDate = new Date(periodStartDate); 

  // Add the periodLength (number of days) to the start date
  startDate.setDate(startDate.getDate() + periodLength);

  // Return the final date (periodEndDate)
  return startDate;
}

function calculateExpectedPeriodStartDate(periodStartDate : Date, avgMenstrualCycleLength : number) {
 
  const startDate = new Date(periodStartDate); 

  startDate.setDate(startDate.getDate() + avgMenstrualCycleLength);

  return startDate;
}

function calculateOvulationDate(expectedPeriodStartDate : Date) {
  const startDate = new Date(expectedPeriodStartDate); 

  startDate.setDate(startDate.getDate() - 14);

  return startDate;
}

export class PersonalizedJourneyController extends GenericController<typeof PersonalizeJourney, IPersonalizeJourney> {
  personalizedJourneyService = new PersonalizedJourneyService();

  constructor() {
    super(new PersonalizedJourneyService(), 'Personalize Journey');
  }

  // Create
  create = catchAsync(async (req: Request, res: Response) => {
    const data : IPersonalizeJourney= req.body;
    const user = await User.findById(req.user.userId)

    if(!user){
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found');
    }

    if(user.personalize_Journey_Id){
      // update the personalize journey id 
      const existingJourney = await PersonalizeJourney.findById(user?.personalize_Journey_Id);
      if(existingJourney){
        data.periodEndDate = calculatePeriodEndDate(data.periodStartDate, parseInt(data?.periodLength));
        data.expectedPeriodStartDate = calculateExpectedPeriodStartDate(data.periodStartDate, parseInt(data?.avgMenstrualCycleLength))
        data.predictedOvulationDate = calculateOvulationDate(data.expectedPeriodStartDate); // 14 days before expected period start date

        const updatedPersonalJourney = await PersonalizeJourney.findByIdAndUpdate(existingJourney._id, data, { new: true });

        sendResponse(res, {
          code: StatusCodes.OK,
          data: updatedPersonalJourney,
          message: `${this.modelName} updated successfully`,
          success: true,
        });
      } 
    }else{
      const result = await this.service.create(data);

      if (!result) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Can not create personalize journey');
      }
      
      if (user) {
        user.personalize_Journey_Id = result._id;
        await user?.save();  
      }
      sendResponse(res, {
        code: StatusCodes.OK,
        data: result,
        message: `${this.modelName} created successfully`,
        success: true,
      });
    }

  });

  saveOptionalInformation = catchAsync(async (req: Request, res: Response) => {
    const data = req.body;

    if(!req.user){
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found');
    }

    const userId = req.user.userId;

    const result = await this.personalizedJourneyService.saveOptionalInformation(data, userId);
    //  const result =
    //  if (!result) {
    //   throw new ApiError(StatusCodes.BAD_REQUEST, 'Can not save optional information');
    // }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result, // result
      message: 'Optional information saved successfully',
      success: true,
    });
  })

  // add more methods here if needed or override the existing ones
}
