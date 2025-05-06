import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import { Attachment } from './attachment.model';

import { AttachmentType } from './attachment.constant';
import { GenericService } from '../__Generic/generic.services';
import { IAttachment } from './attachment.interface';
import { uploadFileToSpace } from '../../middlewares/digitalOcean';

export class AttachmentService extends GenericService<typeof Attachment, IAttachment> {
  constructor() {
    super(Attachment);
  }

  async uploadSingleAttachment(
    file: Express.Multer.File,
    folderName: string,
    uploadedByUserId: any,
    // attachedToId : string,
    attachedToType: IAttachment['attachedToType']
  ) {
    let uploadedFileUrl:string = await uploadFileToSpace(file, folderName);

    let fileType :AttachmentType.image | AttachmentType.unknown | AttachmentType.document;
    if (file.mimetype.includes('image')) {
      fileType = AttachmentType.image;
    } else if (file.mimetype.includes('application')) {
      fileType = AttachmentType.document;
    }else{
      fileType = AttachmentType.unknown;
    }

    // ekhon amader ke ekta attachment create korte hobe ..
    return await this.create({
      attachment: uploadedFileUrl,
      attachmentType: fileType,
      attachedToType,
      // attachedToId,
      uploadedByUserId,
    });
  }

  // INFO : multiple file upload korar case e .. controller thekei korte hobe .. loop chalate hobe
  // async uploadMultipleAttachments() {
  // }

  async deleteAttachment(string: string) {
    try {
      await deleteFileFromSpace(string);
    } catch (error) {
      // Error handling for file deletion or DB deletion failure
      console.error('Error during file deletion:', error);
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to delete image'
      );
      // TODO : kon image delete kortesi shetar hint dite hobe ..
      // FIXME
    }
  }

}
