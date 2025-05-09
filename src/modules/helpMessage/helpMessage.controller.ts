import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { HelpMessageService } from './helpMessage.service';
import { HelpMessage } from './helpMessage.model';
import { IHelpMessage } from './helpMessage.interface';
import { GenericController } from '../__Generic/generic.controller';
import catchAsync from '../../shared/catchAsync';
import ApiError from '../../errors/ApiError';
import { User } from '../user/user.model';
import { sendSupportMessageEmail } from '../../helpers/emailService';


// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class HelpMessageController extends GenericController<
  typeof HelpMessage,
  IHelpMessage
> {
  helpMessageService = new HelpMessageService();

  constructor() {
    super(new HelpMessageService(), 'Help Message');
  }

  //[🚧][🧑‍💻✅][🧪] // 🆗
  create = catchAsync(async (req: Request, res: Response) => {
    let { message } = req.body;
    const userId = req.user.userId;

    if (!message) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'message is required.');
    }

    if (!userId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'user id not found.');
    }
    req.body.userId = userId;

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'user not found.');
    }

    // now we have to send email to admin 

    const subject = `Fertie Help - ${user.name} - ${user.subscriptionType} - ${user.email} - ${userId}`;

    await sendSupportMessageEmail(
      user.email,
      user.name, 
      subject,
      message
    );

    
    const helpMessage = await this.helpMessageService.create(req.body);
    res.status(StatusCodes.CREATED).json({
      status: StatusCodes.CREATED,
      message: 'Help Message created successfully',
      data: helpMessage,
    });
  });
  

  // add more methods here if needed or override the existing ones
  
}
