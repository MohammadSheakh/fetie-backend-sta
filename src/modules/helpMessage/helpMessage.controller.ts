import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { HelpMessageService } from './helpMessage.service';
import { HelpMessage } from './helpMessage.model';
import { IHelpMessage } from './helpMessage.interface';
import { GenericController } from '../__Generic/generic.controller';


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
  

  // add more methods here if needed or override the existing ones
  
}
