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
  create = catchAsync(async (req: Request, res: Response) => {
    let { name, email, url, description } = req.body;
    
    const userId = req.user.userId;
    if(!userId){
      throw new ApiError(StatusCodes.BAD_REQUEST, 'user id not found.');
    }

    // handle attachment upload 
    // let attachments : any[] = [];

    
    //   if (req.files && req.files.attachments) {
    //     attachments.push(
    //       ...(await Promise.all(
    //         req.files.attachments.map(async file => {
    //           const attachmentId = await attachmentService.uploadSingleAttachment(
    //             file,
    //             FolderName.fertie,
    //             req.user.userId,
    //             // req.body.projectId, // for attachedToId
    //             AttachedToType.lab,
    //           );
    //           return attachmentId;
    //         })
    //       ))
    //     );
    //   }
    

    // req.body.attachments = attachments;
    req.body.status = TStatus.active;

    // let namePro = name;

    // for(let i = 0; i < 13; i++){
    //    name =`${name} - ${i}`
      const lab = await this.labService.create({
        name,
        email,
        url,
        description,
        // attachments
      });
      // name = namePro;
    // }

    // if (!lab) {
    //   throw new ApiError(StatusCodes.BAD_REQUEST, 'Lab creation failed');
    // }

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Lab created successfully',
      data: null,
    });

    
  });

  // add more methods here if needed or override the existing ones
  
}
