import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import { Attachment } from './attachment.model';
// 🔥🔥 uploadFileToSpace khuje paowa jacche na .. fix korte hobe .. 
import { AttachmentType } from './attachment.constant';
import { GenericService } from '../__Generic/generic.services';
import { IAttachment } from './attachment.interface';

export class AttachmentService extends GenericService<typeof Attachment, IAttachment> {
  constructor() {
    super(Attachment);
  }

  async uploadSingleAttachment(
    file: Express.Multer.File,
    folderName: string,
    user: any,
    attachedToId : string,
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
      uploadedByUserId: user.userId,
      attachedToId,
      attachmentType: fileType,
      attachedToType 
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

  async addOrRemoveReact  (attachmentId: string, userId: string) {
    const attachment = await this.getById(attachmentId);
    if (!attachment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Attachment not found');
    }

    const reaction = await attachment.reactions.find({userId});

    if(!reaction){
      attachment.reactions.push({userId});
    }else{
      attachment.reactions = attachment.reactions.filter(reaction => reaction.userId !== userId);
    }

    // const index = attachment.reactions.indexOf(userId);
    // if (index === -1) {
    //   attachment.reactions.push(userId);
    // } else {
    //   attachment.reactions.splice(index, 1);
    // }

    await attachment.save();
    return attachment;
  }
}
