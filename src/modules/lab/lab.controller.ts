import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../__Generic/generic.controller';
import { Lab } from './lab.model';
import { ILab } from './lab.interface';
import { LabService } from './lab.service';
import catchAsync from '../../shared/catchAsync';
import ApiError from '../../errors/ApiError';
import { AttachmentService } from '../attachments/attachment.service';
import { TStatus } from './lab.constant';


// let conversationParticipantsService = new ConversationParticipentsService();
 let attachmentService = new AttachmentService();

export class LabController extends GenericController<
  typeof Lab,
  ILab
> {
  labService = new LabService();

  constructor() {
    super(new LabService(), 'Lab');
  }

  //[🚧][🧑‍💻✅][🧪] // 🆗
  create = catchAsync(async (req: Request, res: Response) => {
    let { name, email, url, description, phone, websiteURL, address } = req.body;
    
    const userId = req.user.userId;
    if(!userId){
      throw new ApiError(StatusCodes.BAD_REQUEST, 'user id not found.');
    }

    // req.body.attachments = attachments;
    req.body.status = TStatus.active;

      const lab = await this.labService.create({
        name,
        email,
        url,
        description,
        phone,
        websiteURL,
        address,
        // attachments
      });
     
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Lab created successfully',
      data: lab,
    });

    
  });

  // add more methods here if needed or override the existing ones 
}
