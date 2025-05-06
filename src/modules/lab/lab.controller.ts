import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../__Generic/generic.controller';
import { Lab } from './lab.model';
import { ILab } from './lab.interface';
import { LabService } from './lab.service';
import catchAsync from '../../shared/catchAsync';
import { AttachedToType } from '../attachments/attachment.constant';
import { FolderName } from '../../enums/folderNames';
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

  create = catchAsync(async (req: Request, res: Response) => {
    const { name, email, url, description } = req.body;
    const userId = req.user.userId;
    if(!userId){
      throw new ApiError(StatusCodes.BAD_REQUEST, 'user id not found.');
    }

    // handle attachment upload 
    let attachments : any[] = [];

    /*
      if (req.files && req.files.attachments) {
        attachments.push(
          ...(await Promise.all(
            req.files.attachments.map(async file => {
              const attachmentId = await attachmentService.uploadSingleAttachment(
                file,
                FolderName.fertie,
                req.user.userId,
                // req.body.projectId, // for attachedToId
                AttachedToType.lab,
              );
              return attachmentId;
            })
          ))
        );
      }
    */

    req.body.attachments = attachments;
    req.body.status = TStatus.active;

    const lab = await this.labService.create({
      name,
      email,
      url,
      description,
      attachments,     
    });

    if (!lab) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Lab creation failed');
    }

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Lab created successfully',
      data: lab,
    });

    
  });

  // add more methods here if needed or override the existing ones 
}
