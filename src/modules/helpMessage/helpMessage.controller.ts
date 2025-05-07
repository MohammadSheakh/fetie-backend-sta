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
  /*
  convnext achived the highest scores across all metrics, highlighting
  its superior ability to accurately classify coffee leaf diseases. 

  Vision transformer and swin transformer, though effective, were 
  less practical for real time scenarios due to their high computational
  demands.  

  VGG-19, despite its established history, struggled with overfitting
  and exhibited lower accuracy, further showcasing the advantages of 
  convNext.



  convNext performance was compared to existing methods .  
  A Study by hasan et al, in 2022 he achived 90% accuracy using color processing technique.
  but struggled with precision and scalability. Novtahaning et al utilized ensemble learning
  and achived 97.31%  but the approach required significant computational resources. 
  
  yamashita and leite in 2023 proposed edge- based models that achived 98% accuracy
  but these were limited in their adaptability to diverse datasets. 

  in 2022 paulos achived 99% accuracy with res net 50; however overfitting 
  issues were observed with smaller datasets.

  in contrast, convNext delivered consistently superior accuracy and adaptability, 
  addressing challenges faced by these methods .


  conclusion : 

  Superior performance
  Scalability and Adaptability
  Practicality for Real world use
  impact on agriculture 

  Future Work:
  Expand to other crops
  improve interpretability
  optimize for edge devices
  sustainability focus
  global scalability 

  */
}
